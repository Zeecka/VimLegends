import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus inside a modal panel for real accessibility:
 *  - focuses the panel (which should carry tabIndex={-1}) on open,
 *  - cycles Tab / Shift+Tab within the panel instead of leaking to the page behind,
 *  - closes on Escape,
 *  - restores focus to whatever was focused before the modal opened, on close.
 *
 * Listeners are capture-phase so the focus-sacred editor/terminal surface behind
 * the overlay never sees these keys. Pass the panel ref and the close handler.
 */
export function useFocusTrap(panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const panel = panelRef.current
    const prevFocused = document.activeElement as HTMLElement | null

    // Focus the panel itself so the first Tab lands inside, not on the page behind.
    panel?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || active === panel || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      prevFocused?.focus?.()
    }
  }, [panelRef, onClose])
}
