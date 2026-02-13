import { defineRecipe } from '@pandacss/dev'

export const h6Style = defineRecipe({
  className: 'r_h6',
  base: {
    fontSize: '3.5r',
    fontWeight: '600',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
    textTransform: 'uppercase',
  },
})
