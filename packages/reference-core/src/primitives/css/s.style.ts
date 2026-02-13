import { defineRecipe } from '@pandacss/dev'

export const sStyle = defineRecipe({
  className: 'r_s',
  base: {
    textDecoration: 'line-through',
    opacity: '0.7',
  },
})
