import { defineRecipe } from '@pandacss/dev'

export const smallStyle = defineRecipe({
  className: 'r_small',
  base: {
    fontSize: 'small',
    lineHeight: '1.4',
  },
})
