import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const codeStyle = defineRecipe({
  className: 'r_code',
  base: {
    ...baseTypography,
    fontFamily: 'mono',
    fontSize: '0.9em',
    backgroundColor: 'gray.100',
    color: 'pink.600',
    paddingInline: '0.4em',
    paddingBlock: '0.15em',
    borderRadius: 'sm',
  },
})
