import { defineRecipe } from '@pandacss/dev'

export const sampStyle = defineRecipe({
  className: 'r_samp',
  base: {
    fontFamily: 'mono',
    fontSize: '0.9em',
    backgroundColor: 'gray.50',
    color: 'gray.700',
    paddingInline: '0.3em',
    paddingBlock: '0.1em',
    borderRadius: 'sm',
  },
})
