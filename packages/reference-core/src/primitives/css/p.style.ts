import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const pStyle = defineRecipe({
  className: 'r_p',
  base: {
    ...baseTypography,
    fontSize: '4r',
    lineHeight: '1.6',
    marginTop: '0',
    marginBottom: '1em',
  },
})
