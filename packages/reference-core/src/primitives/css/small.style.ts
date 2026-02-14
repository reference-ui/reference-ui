import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const smallStyle = defineRecipe({
  className: 'r_small',
  base: {
    ...baseTypography,
    fontSize: 'small',
    lineHeight: '1.4',
  },
})
