export const baseTypography = {
  fontFamily: 'sans',
  letterSpacing: '-0.01em',
  color: '{colors.ui.copy.foreground}',
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
    'color, background-color, border-color, box-shadow, opacity, outline-color, outline-offset',
  transitionDuration: '300ms',
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

export const trackBackground =
  'color-mix(in oklch, {colors.ui.progress.track.mixForeground} 12%, {colors.ui.progress.track.mixBackground})'

export const formControlSize = {
  height: '8.5r',
  paddingBlock: '0.75r',
} as const
