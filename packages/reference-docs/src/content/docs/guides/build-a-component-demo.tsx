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
      slate: { bg: 'slate.500/strong' },
      violet: { bg: 'violet.500/strong' },
      rose: { bg: 'rose.500/strong' },
    },
  },
  defaultVariants: { tone: 'slate' },
})

type CardProps = DivProps & RecipeVariantProps<typeof card>

function Card({ tone, className, ...props }: CardProps) {
  return <Div className={`${card({ tone })} ${className ?? ''}`} {...props} />
}

export function CardDemo() {
  return (
    <>
      <Card>Slate</Card>
      <Card tone="violet">Violet</Card>
      <Card tone="rose">Rose</Card>
      <Card tone="violet" padding="6r">
        More padding
      </Card>
    </>
  )
}
