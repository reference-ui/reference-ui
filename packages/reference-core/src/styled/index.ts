import { defineTokens } from '@pandacss/dev'
import { colors } from './colors'
import { fontStaticCssProperties, fontTokens, defaultGlobalFontface } from './font.js'
import { getRhythm } from './rhythm'


export { getRhythm, defaultGlobalFontface }

/** Default design tokens */
export const tokens = defineTokens({
  colors,
  ...fontTokens,
  spacing: {
    px: { value: '1px' },
    r: { value: '0.25rem' },
    '0.5r': { value: getRhythm(0.5) },
    '1/2r': { value: getRhythm(1, 2) },
    '1/3r': { value: getRhythm(1, 3) },
    '1/4r': { value: getRhythm(1, 4) },
    '1/5r': { value: getRhythm(1, 5) },
    '1/6r': { value: getRhythm(1, 6) },
    '1r': { value: getRhythm(1) },
    '1.5r': { value: getRhythm(1.5) },
    '2r': { value: getRhythm(2) },
    '3r': { value: getRhythm(3) },
    '4r': { value: getRhythm(4) },
    '5r': { value: getRhythm(5) },
    '6r': { value: getRhythm(6) },
    '8r': { value: getRhythm(8) },
    '10r': { value: getRhythm(10) },
    '12r': { value: getRhythm(12) },
  },
  radii: {
    none: { value: '0' },
    sm: { value: '0.125rem' },
    base: { value: '0.25rem' },
    md: { value: '0.375rem' },
    lg: { value: '0.5rem' },
    xl: { value: '0.75rem' },
    '2xl': { value: '1rem' },
    '3xl': { value: '1.5rem' },
    full: { value: '9999px' },
  },
})

export const defaultTheme = {
  extend: {
    tokens,
  },
}

export const defaultStaticCss = {
  css: [
    {
      properties: {
        backgroundColor: ['*'],
        color: ['*'],
        borderColor: ['*'],
        padding: ['*'],
        paddingLeft: ['*'],
        paddingRight: ['*'],
        paddingTop: ['*'],
        paddingBottom: ['*'],
        margin: ['*'],
        gap: ['*'],
        ...fontStaticCssProperties,
        borderRadius: ['*'],
        borderWidth: ['*'],
        font: ['*'],
      },
    },
  ],
}


