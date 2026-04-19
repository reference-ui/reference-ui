import { globalCss } from '@reference-ui/system'

export const rootThemeVars = {
  '--r-base': '16px',
  '--r-density': '1',
  '--spacing-r': 'calc(var(--r-base) * var(--r-density))',
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
