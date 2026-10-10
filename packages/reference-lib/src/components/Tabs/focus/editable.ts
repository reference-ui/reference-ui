/**
 * Editable-descendant guards: clicks and presses starting in nested
 * inputs, selects, textareas, or contenteditables must not select the
 * tab — including native keyup-clicks and portalled editables whose
 * React-tree events bubble through. Plain label chrome still activates.
 */
// Interactive descendants that own their own activation (TB-EVENT-01/02):
// clicks bubbling from these (including native Space/Enter keyup-clicks
// from nested or portalled editables) must not select the tab. Plain
// label chrome (spans, icons) still activates.
export const TAB_EDITABLE_SELECTOR =
  'input,textarea,select,[contenteditable]:not([contenteditable="false"])'

export function isEditableClickTarget(target: Element | null): boolean {
  if (!target || typeof target.closest !== 'function') return false
  return target.closest(TAB_EDITABLE_SELECTOR) !== null
}
