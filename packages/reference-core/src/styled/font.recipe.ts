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
      },
      serif: {
        fontFamily: 'serif',
        letterSpacing: 'normal',
      },
      mono: {
        fontFamily: 'mono',
        letterSpacing: '-0.08em',
        verticalAlign: '-10em'
      },
    },
  },
})
