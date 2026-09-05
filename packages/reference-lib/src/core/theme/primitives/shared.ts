export const baseTypography = {
  fontFamily: 'sans',
  letterSpacing: '-0.01em',
  color: '{colors.design.text.base}',
  fontSize: '4r',
} as const

export const blockText = {
  ...baseTypography,
  fontSize: '4r',
  lineHeight: '1.6',
} as const

export const focusRingStyles = {
  outline: '2px solid transparent',
  outlineOffset: '4px',
  transitionProperty:
    'border-color, box-shadow, opacity, outline-color, outline-offset',
  transitionDuration: '150ms',
  transitionTimingFunction: 'ease',
  _focusVisible: {
    focusVisibleRing: 'outside',
    focusRingColor: '{colors.ui.focus.ring}',
    focusRingOffset: '2px',
    focusRingWidth: '2px',
    focusRingStyle: 'solid',
    boxShadow: 'none',
  },
} as const

export const focusRing = focusRingStyles._focusVisible

export const thumbFocusRingStyles = {
  boxShadow: '0 0 0 4px color-mix(in oklch, {colors.ui.focus.ring} 80%, transparent)',
} as const

export function pressableActiveStyles(background: string) {
  return {
    boxShadow: `0 0 0 4px color-mix(in oklch, ${background} 15.2%, transparent)`,
  } as const
}

export const trackBackground =
  'color-mix(in oklch, {colors.ui.progress.track.mixForeground} 12%, {colors.ui.progress.track.mixBackground})'

export const controlSize = {
  height: '8.5r',
  paddingBlock: '0.75r',
} as const

/**
 * Standard 34px control height (8.5r where 1r = 4px).
 * Shared across buttons, inputs, fields, and dropdown items (Combobox, Menu, Listbox).
 */
export const controlHeight = controlSize.height
export const controlHeightPx = '34px'

// Aliases for backwards compatibility
export const formControlSize = controlSize
export const formControlHeight = controlHeight
export const formControlHeightPx = controlHeightPx

/**
 * 3 icon size tokens packaged with reference-lib:
 * - small: 4r (16px) — compact / dense inline text companion
 * - base: 5r (20px) — default, fits into controls (34px height) nicely
 * - large: 6r (24px) — headings / prominent UI
 */
export const iconSizes = {
  small: '4r',
  base: '5r',
  large: '6r',
  sm: '4r',
  md: '5r',
  lg: '6r',
} as const

export const defaultIconSize = iconSizes.base

