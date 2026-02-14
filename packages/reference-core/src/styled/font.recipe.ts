import { defineRecipe } from '@pandacss/dev'

/**
 * Font preset recipes. Applied via font prop; use cx() at runtime.
 * Full static CSS emission—color, etc. work because recipes are precompiled.
 */
export const fontStyle = defineRecipe({
  className: 'r_font',
  variants: {
    font: {
      sans: {
        fontFamily: 'sans',
        letterSpacing: '-0.01em',
        fontWeight: '400',
      },
      serif: {
        fontFamily: 'serif',
        letterSpacing: 'normal',
        fontWeight: '373',
      },
      mono: {
        fontFamily: 'mono',
        letterSpacing: '-0.04em',
        fontWeight: '379',
      },
    },
  },
})
