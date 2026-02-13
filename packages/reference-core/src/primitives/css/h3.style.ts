import { defineRecipe } from '@pandacss/dev'

export const h3Style = defineRecipe({
  className: 'r_h3',
  base: {
    fontSize: '5r',
    fontWeight: 'bold',
    lineHeight: '10r',
    marginTop: '0',
    marginBottom: '3r',
  },
})
