/**
 * NumberField's private subtree scopes: the field context carrying the
 * controlled value, clean display text, bounds, state flags, the transient
 * draft buffer plus its step base, the epoch generations, and every
 * action and edit handler the parts invoke — and the group scope carrying
 * the named-part registry Groups count to catch nested extras. Internal
 * only, never re-exported.
 */
import * as React from 'react'

export interface NumberFieldContextValue {
  value: number | null
  // Clean-state rendered text (Intl formatting of the controlled
  // value). The Input shows the verbatim draft while dirty, this otherwise.
  displayValue: string
  min?: number
  max?: number
  step: number
  disabled: boolean
  readOnly: boolean
  required: boolean
  // Managed invalid union: application invalid, owned numeric-constraint
  // state, or a retained failed boundary. Only the latter two block submit.
  invalid: boolean
  inputMode: 'text' | 'decimal' | 'numeric'
  // Stable Input identity: explicit Input id wins, else a pinned useId.
  // Steppers read the same value for aria-controls (same-commit retarget).
  inputId: string
  // Transient edit buffer (dirty session + live
  // request); null means clean (input shows formatted controlled
  // value). Typing stages the verbatim draft and requests newly parseable
  // meanings live; commit boundaries (blur, Enter, step actions) flush.
  draft: string | null
  // Complete dirty candidate (parseable, clamped once) or null; steppers
  // and keys use it as their base, falling back to controlled value.
  stepBase: number | null
  // Form reset generation: steppers end active holds when it advances.
  resetEpoch: number
  // NF-DYNAMIC-05 replacement generation: non-echo value/locale/format
  // swaps advance it; steppers end active holds when it advances.
  replacementEpoch: number
  increment: (factor?: number) => void
  decrement: (factor?: number) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleCompositionStart: () => void
  handleCompositionEnd: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  commitDraft: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  focusInput: () => void
}

export const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(null)

// Group membership scope: present only inside a Group. Named
// parts throw a part-specific diagnostic when it is absent (misplaced
// outside any Group); the registry counts catch nested extras that the
// direct-children scan cannot see.
export type NumberFieldPartKind = 'input' | 'increment' | 'decrement'

export interface NumberFieldGroupScopeValue {
  registerPart: (kind: NumberFieldPartKind) => () => void
}

export const NumberFieldGroupContext = React.createContext<NumberFieldGroupScopeValue | null>(null)
