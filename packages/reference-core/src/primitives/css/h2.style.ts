import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const h2Style = defineRecipe({
  className: 'r_h2',
  base: {
    ...baseTypography,
    fontSize: '6r',
    fontWeight: 'bold',
    lineHeight: '10r',
    marginTop: '0',
    marginBottom: '3r',
  },
})
