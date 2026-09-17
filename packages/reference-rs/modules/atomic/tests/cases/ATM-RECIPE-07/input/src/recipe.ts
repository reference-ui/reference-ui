import { recipe } from '@reference-ui/react'

export const buttonStyle = recipe({
  className: 'buttonStyle',
  base: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  variants: {
    variant: {
      solid: {
        backgroundColor: 'blue',
        color: 'white',
        _hover: { backgroundColor: 'darkblue' },
        _disabled: { backgroundColor: 'gray', color: 'black' },
      },
      outline: {
        border: '1px solid',
        backgroundColor: 'transparent',
        color: 'blue',
        _hover: { backgroundColor: 'blue', color: 'white' },
        _disabled: { borderColor: 'gray', color: 'gray' },
      },
    },
  },
  defaultVariants: { variant: 'solid' },
})
void buttonStyle
