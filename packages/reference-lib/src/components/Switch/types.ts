/**
 * Switch's public contract: the SwitchProps button surface minus the role,
 * type, and managed ARIA/state the root owns, plus the SwitchThumbProps span
 * surface for authored thumbs. Kept free of JSX and logic so consumers and
 * the type tests can import the shape without mounting anything.
 */
import type * as React from 'react'
import type { PrimitiveProps } from '@reference-ui/react'

export type SwitchProps = Omit<
  PrimitiveProps<'button'>,
  'onChange' | 'role' | 'type' | 'aria-checked' | 'aria-pressed' | 'data-state' | 'data-disabled'
> & {
  /** Controlled state. */
  checked?: boolean
  /**
   * Initial state when `checked` is left out.
   * @default false
   */
  defaultChecked?: boolean
  /**
   * Called with the new state on each click, Space or Enter. Not called when
   * `checked` changes from outside.
   */
  onChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void
  /**
   * Stops interaction.
   * @default false
   */
  disabled?: boolean
}

export type SwitchThumbProps = PrimitiveProps<'span'>
