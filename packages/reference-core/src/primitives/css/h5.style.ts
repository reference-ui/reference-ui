import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const h5Style = defineRecipe({
  className: 'r_h5',
  base: {
    ...baseTypography,
    fontSize: '4.5r',
    fontWeight: '500',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
  },
})
