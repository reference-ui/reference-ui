/**
 * Menu focus restoration: returning focus to the root trigger on
 * dismiss (skipping disabled or detached triggers for a live
 * fallback), and Tab-time handoff to the next tabbable past the
 * trigger. Reads live DOM at use time; unit-tested in happy-dom.
 */
export function restoreFocusToTrigger(
  trigger: HTMLElement | null | undefined,
  fallback: HTMLElement | null | undefined = null
) {
  if (
    trigger &&
    trigger.isConnected &&
    !trigger.hasAttribute('disabled') &&
    trigger.getAttribute('aria-disabled') !== 'true'
  ) {
    trigger.focus()
    return
  }
  if (fallback && fallback.isConnected) {
    fallback.focus()
  }
}

export function findNextTabbable(from: HTMLElement, reverse = false): HTMLElement | null {
  const allTabbables = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null || el.offsetWidth > 0)

  const index = allTabbables.indexOf(from)
  if (index === -1) return null
  return reverse ? (allTabbables[index - 1] ?? null) : (allTabbables[index + 1] ?? null)
}
