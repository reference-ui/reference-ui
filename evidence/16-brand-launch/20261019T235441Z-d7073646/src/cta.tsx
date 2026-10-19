import { Div, recipe, type DivProps, type RecipeVariantProps } from '@reference-ui/react'

export const fernCard = recipe({
  className: 'fern-card',
  base: {
    padding: 'launch.card',
    borderRadius: 'launch.card',
    bg: 'launch.panel',
    color: 'launch.ink',
    border: '1px solid {colors.launch.line}',
    display: 'grid',
    gap: 'launch.gap',
  },
  variants: {
    tone: {
      filled: { bg: 'launch.brand', color: 'launch.brandText' },
      quiet: { bg: 'launch.panel', color: 'launch.ink' },
    },
    density: {
      compact: { padding: 'launch.card' },
      roomy: { padding: 'launch.roomy' },
    },
  },
  defaultVariants: { tone: 'filled', density: 'compact' },
  compoundVariants: [
    {
      tone: 'quiet',
      density: 'roomy',
      css: { borderWidth: '3px', borderColor: 'launch.brand' },
    },
  ],
})

type CtaCardProps = DivProps & RecipeVariantProps<typeof fernCard>

export function CtaCard({ tone, density, className, children, ...rest }: CtaCardProps) {
  const classes = fernCard({ tone, density })

  return (
    <Div {...rest} className={className === undefined ? classes : `${classes} ${className}`}>
      {children}
    </Div>
  )
}
