/**
 * Element eligibility: which single nodes can take focus at all
 * (isElementFocusable) and which of those participate in sequential Tab
 * (isElementTabbable). Visibility, disabled fieldsets with their first-legend
 * exception, closed details, and rendered geometry all live here, so the
 * traversal and radio passes share one reading of native tabbability.
 */

export function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false
  if (el.hasAttribute('hidden') || el.closest('[hidden]')) return false
  if (el.hasAttribute('inert') || el.closest('[inert]')) return false

  try {
    let current: HTMLElement | null = el
    while (current) {
      const style = current.ownerDocument.defaultView?.getComputedStyle(current)
      if (
        !style ||
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.visibility === 'collapse'
      ) {
        return false
      }
      current = current.parentElement
    }
  } catch {
    return false
  }

  return true
}

function firstLegend(fieldset: HTMLFieldSetElement): HTMLLegendElement | null {
  for (const child of fieldset.children) {
    if (child instanceof HTMLLegendElement) return child
  }
  return null
}

export function firstSummary(details: HTMLDetailsElement): HTMLElement | null {
  for (const child of details.children) {
    if (child instanceof HTMLElement && child.tagName === 'SUMMARY') return child
  }
  return null
}

function isDisabledFieldsetExcluded(el: HTMLElement): boolean {
  const fieldset = el.closest('fieldset[disabled]')
  if (!(fieldset instanceof HTMLFieldSetElement)) return false
  const legend = firstLegend(fieldset)
  return !legend || !legend.contains(el)
}

function isClosedDetailsExcluded(el: HTMLElement): boolean {
  let current: HTMLElement | null = el
  while (current) {
    if (current instanceof HTMLDetailsElement && !current.open) {
      const summary = firstSummary(current)
      if (summary && (el === summary || summary.contains(el))) {
        current = current.parentElement
        continue
      }
      return true
    }
    current = current.parentElement
  }
  return false
}

function hasRenderedBox(el: HTMLElement): boolean {
  if (el.getClientRects().length > 0) return true
  if (el.offsetWidth > 0 || el.offsetHeight > 0) return true
  return el.tagName === 'IFRAME'
}

export function isElementFocusable(el: HTMLElement): boolean {
  if (!isElementVisible(el)) return false
  if ((el as HTMLButtonElement).disabled) return false
  if (isDisabledFieldsetExcluded(el)) return false
  if (isClosedDetailsExcluded(el)) return false
  const tabIndex = tabIndexValue(el)
  if (tabIndex !== null && tabIndex >= -1) return true
  return isNativelyTabbableKind(el)
}

export function tabIndexValue(el: HTMLElement): number | null {
  if (!el.hasAttribute('tabindex')) return null
  const parsed = Number.parseInt(el.getAttribute('tabindex') || '', 10)
  return Number.isNaN(parsed) ? null : parsed
}

function isNativelyTabbableKind(el: HTMLElement): boolean {
  const tag = el.tagName
  if (tag === 'A') return el.hasAttribute('href')
  if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') return true
  if (tag === 'INPUT') return (el as HTMLInputElement).type !== 'hidden'
  if (tag === 'IFRAME' || tag === 'SUMMARY') return true
  if (tag === 'AUDIO' || tag === 'VIDEO') return el.hasAttribute('controls')
  const editable = el.getAttribute('contenteditable')
  return editable !== null && editable !== 'false'
}

export function isElementTabbable(el: HTMLElement): boolean {
  if (!isElementFocusable(el)) return false
  const tabIndex = tabIndexValue(el)
  if (tabIndex !== null && tabIndex < 0) return false
  if (tabIndex !== null && tabIndex >= 0) return hasRenderedBox(el)
  if (!isNativelyTabbableKind(el)) return false
  return hasRenderedBox(el)
}
