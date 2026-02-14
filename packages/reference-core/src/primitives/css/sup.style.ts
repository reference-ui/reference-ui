import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const supStyle = defineRecipe({
  className: 'r_sup',
  base: {
    ...baseTypography,
    fontSize: 'xs',
    verticalAlign: 'super',
    lineHeight: '0',
  },
})
