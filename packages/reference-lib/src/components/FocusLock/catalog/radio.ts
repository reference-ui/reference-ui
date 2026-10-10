/**
 * Named-radio collapsing: a checked group contributes only its checked
 * member, an unchecked group keeps every member, and separate forms stay
 * independent. collectRadioState scans one candidate pass for the checked
 * member per group key, and includeRadio keeps or drops each radio against it.
 */

function radioGroupKey(el: HTMLInputElement): string {
  const name = el.name
  if (!name) return ''
  const formId = el.form ? `form:${el.form.id || 'anon'}` : 'doc'
  return `${formId}:${name}`
}

export function includeRadio(
  el: HTMLElement,
  radioState: Map<string, HTMLInputElement | null>
): boolean {
  if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) return true
  const key = radioGroupKey(el)
  const checked = radioState.get(key)
  if (checked) return checked === el
  return true
}

export function collectRadioState(candidates: HTMLElement[]): Map<string, HTMLInputElement | null> {
  const state = new Map<string, HTMLInputElement | null>()
  for (const el of candidates) {
    if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) continue
    const key = radioGroupKey(el)
    if (!state.has(key)) state.set(key, null)
    if (el.checked) state.set(key, el)
  }
  return state
}
