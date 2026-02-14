import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const sampStyle = defineRecipe({
  className: 'r_samp',
  base: {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: '0.9em',
    backgroundColor: 'gray.50',
    color: 'gray.700',
    paddingInline: '0.3em',
    paddingBlock: '0.1em',
    borderRadius: 'sm',
  },
})
