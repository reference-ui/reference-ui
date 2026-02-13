import { defineRecipe } from '@pandacss/dev'

export const subStyle = defineRecipe({
  className: 'r_sub',
  base: {
    fontSize: 'xs',
    verticalAlign: 'sub',
    lineHeight: '0',
  },
})
