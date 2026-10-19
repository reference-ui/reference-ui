// Worked card example for the build-a-component guide.
// It takes nothing and emits the guide's CardDemo. Colocated with the page that embeds it.
import { Div, type DivProps, type RecipeVariantProps, recipe } from '@reference-ui/react'

/**
 * The Card from the Build a component guide, rendered as written there. The
 * recipe and the component are the page's code sample, so the preview proves
 * the sample syncs, type-checks and paints both tones.
 */
const card = recipe({
  className: 'card',
  base: {
    padding: '4r',
    borderRadius: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  variants: {
    tone: {
      outline: { borderColor: 'design.accent.border' },
      filled: { bg: 'design.bg.muted', borderColor: 'transparent' },
    },
  },
  defaultVariants: { tone: 'outline' },
})

type CardProps = DivProps & RecipeVariantProps<typeof card>

function Card({ tone, className, ...props }: CardProps) {
  return <Div className={`${card({ tone })} ${className ?? ''}`} {...props} />
}

export function CardDemo() {
  return (
    <>
      <Card>Outline by default</Card>
      <Card tone="filled">Filled</Card>
      <Card tone="filled" padding="6r">
        Filled, more padding
      </Card>
    </>
  )
}
