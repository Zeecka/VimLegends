import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Optional accounts/score backend (server/). Outside Docker it's on localhost;
// inside the dev container the API is another service reachable as `api`
// (set VITE_API_TARGET=http://api:3001). When it isn't running the proxy 502s,
// /api/config fails, and the app degrades to offline mode.
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3001'

// Bind-mounted source in a container may not deliver inotify events reliably;
// VITE_USE_POLLING=true switches the watcher to polling so HMR still fires.
const usePolling = process.env.VITE_USE_POLLING === 'true'

// When the dev server sits behind a public HTTPS reverse proxy (docker-compose.dev.yml
// on a real domain), Vite blocks unknown Host headers and its HMR client would try
// ws://<host>:<devPort>, which the proxy doesn't expose. VITE_PUBLIC_HOST opts that
// host in and points HMR at wss://<host>:443. Leave unset for normal localhost dev.
const publicHost = process.env.VITE_PUBLIC_HOST

// Security headers for the dev server. The live sites currently serve THIS Vite
// dev server (HMR) behind the public proxy, so these ship to real browsers — we
// harden here too, not just in the production nginx.conf. The CSP is necessarily
// looser than nginx's: Vite HMR needs inline scripts (the react-refresh
// preamble), eval, and a ws/wss socket. Everything else stays locked down, and
// X-Frame-Options + frame-ancestors still fully close the clickjacking gap.
// Keep this in lockstep with the strict CSP in nginx.conf (which the static
// production build serves instead).
// Google AdSense: the loader fetches further scripts, opens ad iframes, and beacons
// back, all from Google's ad-serving hosts — allow-listed here (script/frame/connect)
// or the CSP kills the ads. img-src already permits https: so ad creatives load.
// Keep this in lockstep with the AD_* additions in nginx.conf.
const AD_SCRIPT = 'https://*.googlesyndication.com https://*.googleadservices.com https://*.google.com https://*.gstatic.com https://*.doubleclick.net'
const AD_FRAME = 'https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com'
const AD_CONNECT = 'https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://*.gstatic.com'

const DEV_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${AD_SCRIPT}`, // HMR / react-refresh preamble + AdSense
  "style-src 'self' 'unsafe-inline'", // framer-motion / Tailwind inline styles
  "img-src 'self' https: data:", // OAuth avatars, emoji/thumbnail data URIs, ad creatives
  "font-src 'self'",
  `connect-src 'self' https://api.github.com ws: wss: ${AD_CONNECT}`, // API + GitHub star count + HMR socket + AdSense
  `frame-src ${AD_FRAME}`, // AdSense ad iframes
  "worker-src 'self' blob:", // three.js decoder workers
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ')

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': DEV_CSP,
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Relative base only helps the static build (subpath / file:// hosting).
  // The dev server serves from '/', where a relative base breaks HMR client URLs.
  base: command === 'build' ? './' : '/',
  server: {
    headers: securityHeaders,
    proxy: { '/api': apiTarget },
    ...(usePolling ? { watch: { usePolling: true } } : {}),
    ...(publicHost ? { allowedHosts: [publicHost], hmr: { host: publicHost, protocol: 'wss', clientPort: 443 } } : {}),
  },
  preview: {
    proxy: { '/api': apiTarget },
  },
}))
