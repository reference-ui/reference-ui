import * as React from 'react'
import { Span, recipe, type RecipeVariantProps } from '@reference-ui/react'
import { MonoText } from './MonoText'

const summaryChipRecipe = recipe({
  base: {
    fontSize: '4r',
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
        bg: 'reference.codeBackground',
        color: 'gray.200',
      },
      accent: {
        background: 'sky.100',
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
      <MonoText color={tone === 'soft' ? 'gray.200' : 'sky.950'}>{children}</MonoText>
    </Span>
  )
}
