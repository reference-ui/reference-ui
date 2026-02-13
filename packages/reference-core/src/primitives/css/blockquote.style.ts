import { defineRecipe } from '@pandacss/dev'

export const blockquoteStyle = defineRecipe({
  className: 'r_blockquote',
  base: {
    fontSize: 'h5',
    fontStyle: 'italic',
    lineHeight: '1.6',
    color: 'gray.600',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'gray.300',
    paddingLeft: '1em',
    marginLeft: '0',
    marginRight: '0',
    marginTop: '0',
    marginBottom: '1em',
  },
})
