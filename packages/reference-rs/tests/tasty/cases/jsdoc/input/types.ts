/**
 * Props for a button.
 *
 * Includes common sizing options.
 * @deprecated Use NewButtonProps instead.
 * @remarks This interface is kept for backward compatibility.
 */
export interface ButtonProps {
  /**
   * Preferred size variant.
   * @default "sm"
   * @example
   * <Button size="sm" />
   */
  size?: 'sm' | 'lg'

  // Plain comment fallback.
  disabled?: boolean
}

export type ButtonSize = ButtonProps['size']

/** Same literals as {@link ButtonProps} `size`, but via a named alias (type line should stay the alias name). */
export type NamedButtonSize = 'sm' | 'lg'

export interface ButtonPropsNamedSize {
  size?: NamedButtonSize
}

/** String-literal palette plus `string` (custom values) — same UX as inline literals-only unions. */
export interface ThemeColorProp {
  color?: 'default' | 'primary' | 'secondary' | string
}

/** Named slots or an arbitrary object (e.g. React node / config object). */
export interface SlotOrObjectProp {
  slot?: 'header' | 'footer' | object
}

/** Literals plus both `string` and `object` widenings. */
export interface WideningComboProp {
  mode?: 'a' | 'b' | string | object
}

/**
 * Create a button definition.
 * @returns A normalized button props object.
 */
export type CreateButton = (props: ButtonProps) => ButtonProps
