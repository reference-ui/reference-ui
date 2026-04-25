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

export const focusRing = {
  outline: 'none',
  boxShadow:
    '0 0 0 3px color-mix(in oklch, {colors.ui.focus.ring} 35%, transparent)',
} as const

export const trackBackground =
  'color-mix(in oklch, {colors.ui.progress.track.mixForeground} 12%, {colors.ui.progress.track.mixBackground})'

export const formControlSize = {
  height: '8.5r',
  paddingBlock: '0.75r',
} as const
