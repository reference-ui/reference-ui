import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const h6Style = defineRecipe({
  className: 'r_h6',
  base: {
    ...baseTypography,
    fontSize: '3.5r',
    fontWeight: '600',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
    textTransform: 'uppercase',
  },
})
