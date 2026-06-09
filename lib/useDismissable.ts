import { useEffect, useRef } from 'react'

// Modal accessibility hook: returns a ref to put on the dialog container. While
// mounted it closes on Escape, traps Tab focus inside the container, moves focus
// in on open, and restores focus to the previously focused element on close.
//
// The container should also have role="dialog", aria-modal="true", and tabIndex={-1}
// so it can receive focus as a fallback when it holds no focusable children.
export function useDismissable<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)
  // Keep the latest onClose without re-running the effect (callers pass inline arrows).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const node = ref.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = (): HTMLElement[] => {
      if (!node) return []
      const selector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      return Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(el => el.offsetParent !== null)
    }

    // Move focus into the dialog on open.
    const items = focusables()
    ;(items[0] ?? node)?.focus?.()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key === 'Tab' && node) {
        const list = focusables()
        if (list.length === 0) { e.preventDefault(); return }
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [])

  return ref
}
