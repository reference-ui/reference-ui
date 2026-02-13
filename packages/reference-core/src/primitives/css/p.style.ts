import { defineRecipe } from '@pandacss/dev'

export const pStyle = defineRecipe({
  className: 'r_p',
  base: {
    fontSize: 'body',
    lineHeight: '1.6',
    marginTop: '0',
    marginBottom: '1em',
  },
})
