import { forwardRef } from 'react'
import {
  Button as ButtonPrimitive,
  recipe,
  type RecipeVariantProps,
} from '@reference-ui/react'

const buttonRecipe = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'md',
    cursor: 'pointer',
    border: 'none',
    fontWeight: 'semibold',
    transition: 'all',
    _disabled: { opacity: 0.5, cursor: 'not-allowed' },
  },
  variants: {
    visual: {
      solid: {
        bg: 'docsAccent',
        color: 'white',
        _hover: { filter: 'brightness(0.92)' },
        _active: { filter: 'brightness(0.85)' },
      },
      ghost: {
        bg: 'transparent',
        color: 'docsAccent',
        _hover: { bg: 'docsAccentSoft' },
        _active: { bg: 'docsAccentSoft' },
      },
      outline: {
        bg: 'docsDemoCard',
        color: 'docsAccent',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: 'docsAccent',
        _hover: { bg: 'docsAccentSoft', borderColor: 'docsAccent' },
        _active: { bg: 'docsAccentSoft' },
      },
    },
    size: {
      sm: { fontSize: 'sm', px: '4', py: '2' },
      md: { fontSize: 'md', px: '5', py: '2.5' },
      lg: { fontSize: 'lg', px: '7', py: '3.5' },
    },
  },
  defaultVariants: {
    visual: 'solid',
    size: 'md',
  },
})

export type ButtonProps = React.ComponentPropsWithoutRef<typeof ButtonPrimitive> &
  RecipeVariantProps<typeof buttonRecipe>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ visual, size, className, ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        className={buttonRecipe({ visual, size }) + (className ? ` ${className}` : '')}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
