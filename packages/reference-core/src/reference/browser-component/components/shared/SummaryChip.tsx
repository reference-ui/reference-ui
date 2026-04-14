// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/shared/SummaryChip.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
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
        color: 'reference.textLight',
      },
      accent: {
        background: 'reference.text',
        color: 'reference.codeBackground',
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
      <MonoText color={tone === 'soft' ? 'reference.textLight' : 'reference.codeBackground'}>{children}</MonoText>
    </Span>
  )
}
