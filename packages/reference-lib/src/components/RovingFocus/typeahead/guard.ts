/** Typeahead entry guards for the RovingFocus kernel. `shouldIgnoreTypeaheadKey`
 * keeps modified keys, multi-character keys, IME-composing keystrokes, and
 * keys targeted at editable descendants out of the search buffer. A
 * convergence seam (FEATURES #7): consumers routing their own keys through
 * `TypeaheadModel` must skip the same keys or they fork the IME/editable
 * behavior — Listbox's live mid-composition focus steal is the bug this
 * prevents. */

export interface TypeaheadGuardEvent {
  readonly key: string
  readonly ctrlKey: boolean
  readonly altKey: boolean
  readonly metaKey: boolean
  readonly target: EventTarget | null
  readonly nativeEvent?: { readonly isComposing?: boolean } | undefined
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined') return false
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true
  if (target.isContentEditable) return true
  return false
}

// Mirrors the kernel's typeahead entry guards. Consumers routing their own
// keys through TypeaheadModel must skip the same keys or they fork the
// IME/editable behavior (FEATURES #7). True = do NOT feed the buffer.
export function shouldIgnoreTypeaheadKey(e: TypeaheadGuardEvent): boolean {
  if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return true
  if (e.nativeEvent?.isComposing === true) return true
  return isEditableTarget(e.target)
}
