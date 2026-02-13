import { defineRecipe } from '@pandacss/dev'

export const markStyle = defineRecipe({
  className: 'r_mark',
  base: {
    backgroundColor: 'yellow.200',
    color: 'gray.900',
    paddingInline: '0.25em',
    borderRadius: 'sm',
  },
})
