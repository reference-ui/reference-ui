import { defineRecipe } from '@pandacss/dev'

export const h4Style = defineRecipe({
  className: 'r_h4',
  base: {
    fontSize: 'h4',
    fontWeight: 'semibold',
    lineHeight: '1.3',
    marginTop: '0',
    marginBottom: '0.5em',
  },
})
