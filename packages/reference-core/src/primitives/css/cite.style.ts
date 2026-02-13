import { defineRecipe } from '@pandacss/dev'

export const citeStyle = defineRecipe({
  className: 'r_cite',
  base: {
    fontStyle: 'italic',
    color: 'gray.500',
  },
})
