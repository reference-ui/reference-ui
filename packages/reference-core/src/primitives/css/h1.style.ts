import { defineRecipe } from '@pandacss/dev'

export const h1Style = defineRecipe({
  className: 'r_h1',
  base: {
    fontSize: '9r',
    fontWeight: 'bold',
    lineHeight: '15r',
    marginTop: '0',
    marginBottom: '3r',
  },
})
