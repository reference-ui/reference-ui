import { defineRecipe } from '@pandacss/dev'

export const preStyle = defineRecipe({
  className: 'r_pre',
  base: {
    fontFamily: 'mono',
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
