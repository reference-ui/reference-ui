import { defineRecipe } from '@pandacss/dev'

export const uStyle = defineRecipe({
  className: 'r_u',
  base: {
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
  },
})
