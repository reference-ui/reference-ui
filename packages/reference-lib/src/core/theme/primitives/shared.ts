import { baseTypography } from './typography/baseTypography'

export const blockText = {
  ...baseTypography,
  fontSize: '4r',
  lineHeight: '1.6',
} as const

export const focusRing = {
  outline: 'none',
  boxShadow:
    '0 0 0 3px color-mix(in oklch, {colors.ui.ring} 35%, transparent)',
} as const

export const trackBackground =
  'color-mix(in oklch, {colors.ui.foreground} 12%, {colors.ui.background})'

export const formControlSize = {
  height: '8.5r',
  paddingBlock: '0.75r',
} as const
