import { forwardRef } from 'react';
import { cva, cx, type RecipeVariantProps } from '../system/css/index.js';
import { Button as ButtonPrimitive } from '../primitives/index.js';

const button = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'md',
    cursor: 'pointer',
    border: 'none',
    fontWeight: 'medium',
    transition: 'all',
    _disabled: { opacity: 0.5, cursor: 'not-allowed' },
  },
  variants: {
    visual: {
      solid: {
        bg: 'blue.500',
        color: 'white',
        _hover: { bg: 'blue.600' },
      },
      ghost: {
        bg: 'transparent',
        color: 'blue.500',
        _hover: { bg: 'blue.50' },
      },
      outline: {
        bg: 'transparent',
        color: 'blue.500',
        border: '1px solid',
        borderColor: 'blue.500',
        _hover: { bg: 'blue.50' },
      },
    },
    size: {
      sm: { fontSize: 'sm', padding: '2' },
      md: { fontSize: 'md', padding: '3' },
      lg: { fontSize: 'lg', padding: '4' },
    },
  },
  defaultVariants: {
    visual: 'solid',
    size: 'md',
  },
});

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> &
  RecipeVariantProps<typeof button>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ visual, size, className, ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        className={cx(button({ visual, size }), className)}
        {...props}
      />
    );
  },
);
