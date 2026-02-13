import { defineRecipe } from '@pandacss/dev'

export const h6Style = defineRecipe({
  className: 'r_h6',
  base: {
    fontSize: 'h6',
    fontWeight: 'semibold',
    lineHeight: '1.4',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0',
    marginBottom: '0.5em',
  },
})
