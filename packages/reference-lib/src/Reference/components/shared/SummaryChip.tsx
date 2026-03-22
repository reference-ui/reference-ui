import * as React from 'react'
import { Span, recipe, type RecipeVariantProps } from '@reference-ui/react'
import { MonoText } from './MonoText.js'

const summaryChipRecipe = recipe({
  base: {
    fontSize: '4.5r',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '1.5rem',
    width: 'fit-content',
    maxWidth: '100%',
    paddingInline: '0.2rem',
    px: '1.5r',
    py: '0.5r',
  },
  variants: {
    tone: {
      soft: {
        bg: 'gray.900',
        color: 'white',
      },
      accent: {
        background: 'blue.950',
        color: 'white',
      },
    },
    radius: {
      pill: { borderRadius: '9999px' },
      rounded: { borderRadius: '1r' },
    },
  },
  defaultVariants: {
    tone: 'soft',
    radius: 'rounded',
  },
})

export type SummaryChipProps = React.ComponentPropsWithoutRef<typeof Span> &
  RecipeVariantProps<typeof summaryChipRecipe>

export function SummaryChip({
  children,
  tone = 'soft',
  radius = 'rounded',
  className,
  ...props
}: SummaryChipProps) {
  return (
    <Span
      className={summaryChipRecipe({ tone, radius }) + (className ? ` ${className}` : '')}
      {...props}
    >
      <MonoText>{children}</MonoText>
    </Span>
  )
}
