import { defineRecipe } from '@pandacss/dev'

export const abbrStyle = defineRecipe({
  className: 'r_abbr',
  base: {
    textDecoration: 'underline dotted',
    textUnderlineOffset: '0.15em',
    cursor: 'help',
  },
})
