import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const qStyle = defineRecipe({
  className: 'r_q',
  base: {
    ...baseTypography,
    fontStyle: 'italic',
    _before: {
      content: '"\\201C"',
    },
    _after: {
      content: '"\\201D"',
    },
  },
})
