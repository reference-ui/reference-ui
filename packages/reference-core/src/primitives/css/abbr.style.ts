import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const abbrStyle = defineRecipe({
  className: 'r_abbr',
  base: {
    ...baseTypography,
    textDecoration: 'underline dotted',
    textUnderlineOffset: '0.15em',
    cursor: 'help',
  },
})
