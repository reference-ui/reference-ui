import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const subStyle = defineRecipe({
  className: 'r_sub',
  base: {
    ...baseTypography,
    fontSize: 'xs',
    verticalAlign: 'sub',
    lineHeight: '0',
  },
})
