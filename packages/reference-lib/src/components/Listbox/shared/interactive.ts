/**
 * Listbox's press guard: isInteractiveDescendant tells option handlers
 * apart from events that belong to in-row interactive content (a button,
 * input, or contenteditable inside the option) or portaled row content.
 * Pure DOM predicate — press, click, and keydown handlers in the option
 * part all ask it before treating an event as the option's own.
 */

export function isInteractiveDescendant(
  target: EventTarget | null,
  currentTarget: EventTarget | null
): boolean {
  if (!target || target === currentTarget) return false
  const el = target as HTMLElement
  const tag = el.tagName?.toLowerCase()
  if (['input', 'textarea', 'select', 'button'].includes(tag)) return true
  if (el.isContentEditable) return true
  return false
}
