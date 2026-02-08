import { defineTokens } from '@pandacss/dev'
import { colors } from './colors'
import { fontStaticCssProperties, fontTokens } from './font.js'

/** Default design tokens */
export const tokens = defineTokens({
  colors,
  ...fontTokens,
  spacing: {
    px: { value: '1px' },
    r: { value: '0.25rem' },
    '0.5r': { value: 'calc(0.5 * var(--spacing-r))' },
    '1r': { value: 'var(--spacing-r)' },
    '1.5r': { value: 'calc(1.5 * var(--spacing-r))' },
    '2r': { value: 'calc(2 * var(--spacing-r))' },
    '3r': { value: 'calc(3 * var(--spacing-r))' },
    '4r': { value: 'calc(4 * var(--spacing-r))' },
    '5r': { value: 'calc(5 * var(--spacing-r))' },
    '6r': { value: 'calc(6 * var(--spacing-r))' },
    '8r': { value: 'calc(8 * var(--spacing-r))' },
    '10r': { value: 'calc(10 * var(--spacing-r))' },
    '12r': { value: 'calc(12 * var(--spacing-r))' },
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
      },
    },
  ],
}


