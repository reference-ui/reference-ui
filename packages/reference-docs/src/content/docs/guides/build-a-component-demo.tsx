// Worked card example for the build-a-component guide.
// It takes nothing and emits the guide's CardDemo. Colocated with the page that embeds it.
import { Div, type DivProps, type RecipeVariantProps, recipe } from '@reference-ui/react'

/**
 * The Card from the Build a component guide, rendered as written there. The
 * recipe and the component are the page's code sample, so the preview proves
 * the sample syncs, type-checks and paints every tone.
 */
const card = recipe({
  className: 'card',
  base: {
    padding: '4r',
    borderRadius: 'md',
  },
  variants: {
    tone: {
      violet: { bg: 'violet.500/firm', color: 'violet.700', _dark: { color: 'violet.200' } },
      blue: { bg: 'blue.500/firm', color: 'blue.700', _dark: { color: 'blue.200' } },
      green: { bg: 'green.500/firm', color: 'green.700', _dark: { color: 'green.200' } },
    },
  },
  defaultVariants: { tone: 'violet' },
})

type CardProps = DivProps & RecipeVariantProps<typeof card>

function Card({ tone, className, ...props }: CardProps) {
  return <Div className={`${card({ tone })} ${className ?? ''}`} {...props} />
}

export function CardDemo() {
  return (
    <>
      <Card tone="violet">Violet</Card>
      <Card tone="blue">Blue</Card>
      <Card tone="green" padding="6r">
        Green, with more padding
      </Card>
    </>
  )
}
