/**
 * NumberField's public contract: the commit behavior union, the invalid
 * reason union, the root props, and the prop types for Group, Input, and
 * both steppers — including the managed-prop unions that keep
 * behavior-owned attributes out of consumer hands. Kept free of JSX and
 * logic so consumers and the type tests can import the shape without
 * mounting anything. The root re-exports every symbol defined here.
 */
import type { PrimitiveProps } from '@reference-ui/react'

// Commit policy: 'snap' commits via the zero-anchored lattice with endpoint
// preservation (order endpoint→lattice→rounding→final clamp); 'validate'
// retains finite under/over/off-step candidates (requests the rounded raw
// candidate, managed invalid state blocks submit) with advisory
// onInvalidCommit alongside onChange; 'none' clamps at commit, never snaps,
// and owns no invalid state. Prop name and snap/validate pair mirror React
// Aria NumberField verbatim; the default ('none') and third value are ours.
export type NumberFieldCommitBehavior = 'snap' | 'validate' | 'none'

export type NumberFieldInvalidCommitReason = 'off-step' | 'out-of-range'

export type NumberFieldProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  value: number | null
  onChange?: (value: number | null) => void
  locale: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  // Interaction/form state. readOnly suppresses stepping and
  // numeric submit blocking while still serializing canonical state;
  // required keeps native valueMissing; invalid is an ARIA/style signal
  // that never blocks submit by itself; name/form own the hidden input.
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string
  form?: string
  // Intl display formatting. The committed value stays a plain
  // number; only the clean (non-editing) rendering is formatted.
  formatOptions?: Intl.NumberFormatOptions
  commitBehavior?: NumberFieldCommitBehavior
  onInvalidCommit?: (attempted: number, reason: NumberFieldInvalidCommitReason) => void
}

// NF-TYPE-03: behavior-owned Input props, absent from the public part type
// and stripped again at runtime so conflicting casts cannot land.
export type NumberFieldManagedInputProp =
  | 'type'
  | 'role'
  | 'value'
  | 'defaultValue'
  | 'inputMode'
  | 'name'
  | 'form'
  | 'min'
  | 'max'
  | 'step'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'aria-disabled'
  | 'aria-readonly'
  | 'aria-required'
  | 'aria-invalid'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuenow'
  | 'aria-valuetext'

export type NumberFieldInputProps = Omit<PrimitiveProps<'input'>, NumberFieldManagedInputProp>

// NF-TYPE-03: Group owns role, aria-disabled, and aria-invalid;
// aria-readonly/aria-required are always absent (unsupported on group —
// data-readonly/data-required carry styling instead). status is Field's
// visual exception and never implies invalid.
export type NumberFieldGroupProps = Omit<
  PrimitiveProps<'div'>,
  'role' | 'aria-disabled' | 'aria-readonly' | 'aria-required' | 'aria-invalid'
> & {
  status?: 'warning'
}

// Each stepper requires an authored
// nonempty accessible-name prop — the aria-label | aria-labelledby union
// (nonempty). Shape mirrors NumberField.md NumberFieldStepperName; runtime
// emptiness is diagnosed separately per NF-TYPE-04.
export type NumberFieldStepperName =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string }

// NF-TYPE-03: behavior-owned stepper props, absent from the public part
// types and stripped again at runtime. data-pressed stays declared so its
// managed ownership is visible; any authored value is stripped.
export type NumberFieldManagedStepperProp =
  | 'type'
  | 'tabIndex'
  | 'role'
  | 'aria-controls'
  | 'aria-disabled'
  | 'aria-readonly'
  | 'aria-required'
  | 'aria-checked'
  | 'aria-pressed'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuenow'
  | 'aria-valuetext'

export type NumberFieldIncrementProps = Omit<
  PrimitiveProps<'button'>,
  NumberFieldManagedStepperProp | 'aria-label' | 'aria-labelledby'
> &
  NumberFieldStepperName & {
    /** Managed by the press-and-hold session machine; any authored value is stripped. */
    'data-pressed'?: string
  }

export type NumberFieldDecrementProps = Omit<
  PrimitiveProps<'button'>,
  NumberFieldManagedStepperProp | 'aria-label' | 'aria-labelledby'
> &
  NumberFieldStepperName & {
    /** Managed by the press-and-hold session machine; any authored value is stripped. */
    'data-pressed'?: string
  }
