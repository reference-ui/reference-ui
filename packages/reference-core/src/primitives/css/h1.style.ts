import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const h1Style = defineRecipe({
  className: 'r_h1',
  base: {
    ...baseTypography,
    fontSize: '9r',
    fontWeight: 'bold',
    lineHeight: '15r',
    marginTop: '0',
    marginBottom: '3r',
  },
})
