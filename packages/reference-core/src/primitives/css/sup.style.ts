import { defineRecipe } from '@pandacss/dev'

export const supStyle = defineRecipe({
  className: 'r_sup',
  base: {
    fontSize: 'xs',
    verticalAlign: 'super',
    lineHeight: '0',
  },
})
