import { defineRecipe } from '@pandacss/dev'

export const h5Style = defineRecipe({
  className: 'r_h5',
  base: {
    fontSize: '4.5r',
    fontWeight: '500',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
  },
})
