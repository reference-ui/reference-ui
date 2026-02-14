import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const sStyle = defineRecipe({
  className: 'r_s',
  base: {
    ...baseTypography,
    textDecoration: 'line-through',
    opacity: '0.7',
  },
})
