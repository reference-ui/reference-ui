import { defineRecipe } from '@pandacss/dev'
import { baseTypography } from './base.typography'

export const markStyle = defineRecipe({
  className: 'r_mark',
  base: {
    ...baseTypography,
    backgroundColor: 'yellow.200',
    color: 'gray.900',
    paddingInline: '0.25em',
    borderRadius: 'sm',
  },
})
