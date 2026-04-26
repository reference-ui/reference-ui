import { globalCss } from '@reference-ui/system'

export const rootThemeVars = {
  '--spacing-root': '0.25rem',
} as const

export const bodyStyles = {
  fontFamily: 'sans',
  letterSpacing: '-0.01em',
  fontSize: '4r',
  containerType: 'inline-size',
} as const

globalCss({
  ':root': rootThemeVars,
})

globalCss({
  body: bodyStyles,
})
