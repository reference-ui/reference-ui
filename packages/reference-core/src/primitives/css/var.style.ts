import { defineRecipe } from '@pandacss/dev'

export const varStyle = defineRecipe({
  className: 'r_var',
  base: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    color: 'blue.600',
  },
})
