import { defineRecipe } from '@pandacss/dev'

export const qStyle = defineRecipe({
  className: 'r_q',
  base: {
    fontStyle: 'italic',
    _before: {
      content: '"\\201C"',
    },
    _after: {
      content: '"\\201D"',
    },
  },
})
