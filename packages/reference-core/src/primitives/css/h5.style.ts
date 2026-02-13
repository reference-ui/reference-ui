import { defineRecipe } from '@pandacss/dev'

export const h5Style = defineRecipe({
  className: 'r_h5',
  base: {
    fontSize: 'h5',
    fontWeight: 'semibold',
    lineHeight: '1.4',
    marginTop: '0',
    marginBottom: '0.5em',
  },
})
