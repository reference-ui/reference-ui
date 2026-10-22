// Worked card for the multi-part components guide.
// It takes nothing and emits the guide's CardPartsDemo. Colocated with the page that embeds it.
import { Div, type DivProps, H3, P, recipe } from '@reference-ui/react'

/**
 * The Card from the Multi-part components guide, rendered as written there; the
 * recipe is named `partsCard` because the build-a-component demo owns `card` in
 * this system. One recipe with slots styles the root, title and body from one
 * call, and the root reaches its title through `data-slot`, so the preview
 * proves the sample syncs, type-checks and paints both sizes.
 */
const card = recipe({
  className: 'partsCard',
  slots: ['root', 'title', 'body'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 'md',
      '&:hover > [data-slot="title"]': { textDecoration: 'underline' },
    },
    title: { margin: '0', fontWeight: '600' },
    body: { margin: '0', opacity: 0.8 },
  },
  variants: {
    size: {
      sm: { root: { padding: '3r', gap: '1r' }, title: { fontSize: '4r' } },
      lg: { root: { padding: '6r', gap: '2r' }, title: { fontSize: '5r' } },
    },
  },
  defaultVariants: { size: 'sm' },
})

type PartsCardProps = DivProps & { size?: 'sm' | 'lg'; heading: string }

function Card({ size = 'sm', heading, children, ...props }: PartsCardProps) {
  const classes = card({ size })
  return (
    <Div data-slot="root" {...props} className={classes.root}>
      <H3 data-slot="title" className={classes.title}>
        {heading}
      </H3>
      <P data-slot="body" className={classes.body}>
        {children}
      </P>
    </Div>
  )
}

export function CardPartsDemo() {
  return (
    <>
      <Card heading="Starter">One project.</Card>
      <Card size="lg" heading="Team">
        Every project in one place.
      </Card>
    </>
  )
}
