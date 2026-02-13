import { defineRecipe } from '@pandacss/dev'

export const h4Style = defineRecipe({
  className: 'r_h4',
  base: {
    fontSize: '4.5r',
    fontWeight: 'bold',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
  },
})
