import * as React from 'react'
import { Span, recipe, type RecipeVariantProps } from '@reference-ui/react'
import { MonoText } from './MonoText'

const summaryChipRecipe = recipe({
  base: {
    fontSize: '4.5r',
    fontWeight: '550',
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
        bg: 'gray.800',
        color: 'gray.200',
      },
      accent: {
        background: 'sky.100',
        borderStyle: 'solid',
        color: 'sky.950',
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
