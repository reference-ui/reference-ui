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
  /** Required. The current value; `null` is empty. */
  value: number | null
  /** Called with each new value. */
  onChange?: (value: number | null) => void
  /** Required. BCP 47 locale for parsing and display. */
  locale: string
  /** Lowest value. */
  min?: number
  /** Highest value. */
  max?: number
  /**
   * Amount each step adds. Must be greater than 0.
   * @default `1`, or `0.01` for percent
   */
  step?: number
  /**
   * Stops interaction and leaves the value out of the form.
   * @default false
   */
  disabled?: boolean
  /**
   * Stops editing and stepping. The value still submits.
   * @default false
   */
  readOnly?: boolean
  /**
   * Sets `required` on the input.
   * @default false
   */
  required?: boolean
  /**
   * Marks the field invalid.
   * @default false
   */
  invalid?: boolean
  /** Adds a hidden input for form submission. */
  name?: string
  /** `id` of the form the hidden input belongs to. */
  form?: string
  /**
   * Display format: currency, percent, units, digits.
   * @default {}
   */
  formatOptions?: Intl.NumberFormatOptions
  /**
   * What a commit does with an off-step or out-of-range value.
   * @default 'none'
   */
  commitBehavior?: NumberFieldCommitBehavior
  /** Reports invalid commits in `validate` mode. */
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
  /** Paints the warning bezel. */
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
