import { defineRecipe } from '@pandacss/dev'

export const kbdStyle = defineRecipe({
  className: 'r_kbd',
  base: {
    fontFamily: 'mono',
    fontSize: '0.85em',
    backgroundColor: 'gray.100',
    color: 'gray.800',
    paddingInline: '0.4em',
    paddingBlock: '0.2em',
    borderRadius: 'sm',
    borderWidth: '1px',
    borderBottomWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'gray.300',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
  },
})
