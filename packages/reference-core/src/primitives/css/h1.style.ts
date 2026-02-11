import { defineRecipe } from '@pandacss/dev'

export const h1 = defineRecipe({
  className: 'r_h1',
  base: {
    fontSize: 'h1',
    fontWeight: 'bold',
    color: 'red.500',
  },
})
