import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const preStyle = defineRecipe({
  className: 'r_pre',
  base: {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: 'small',
    lineHeight: '1.6',
    backgroundColor: 'gray.900',
    color: 'gray.100',
    padding: '1em',
    borderRadius: 'md',
    overflowX: 'auto',
    whiteSpace: 'pre',
    marginTop: '0',
    marginBottom: '1em',
  },
})
