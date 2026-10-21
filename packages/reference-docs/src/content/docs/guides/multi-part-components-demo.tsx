// Worked compound card for the multi-part components guide.
// It takes nothing and emits the guide's CardPartsDemo. Colocated with the page that embeds it.
import { createContext, useContext } from 'react'
import {
  Div,
  type DivProps,
  H3,
  type H3Props,
  P,
  type PProps,
  css,
  recipe,
} from '@reference-ui/react'

/**
 * The Card from the Multi-part components guide, rendered as written there.
 * One recipe per part shares the `size` variant through context, and the
 * root reaches its title through `data-slot`, so the preview proves the
 * sample syncs, type-checks and paints both sizes.
 */
type CardSize = 'sm' | 'lg'

const cardRoot = recipe({
  className: 'cardRoot',
  base: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'md',
    bg: 'slate.500/strong',
    '&:hover > [data-slot="title"]': { textDecoration: 'underline' },
  },
  variants: {
    size: {
      sm: { padding: '3r', gap: '1r' },
      lg: { padding: '6r', gap: '2r' },
    },
  },
  defaultVariants: { size: 'sm' },
})

const cardTitle = recipe({
  className: 'cardTitle',
  base: { margin: '0', fontWeight: '600' },
  variants: {
    size: {
      sm: { fontSize: '4r' },
      lg: { fontSize: '5r' },
    },
  },
  defaultVariants: { size: 'sm' },
})

const cardBody = css({ margin: '0', opacity: 0.8 })

const CardSizeContext = createContext<CardSize>('sm')

type CardRootProps = DivProps & { size?: CardSize }

function CardRoot({ size = 'sm', ...props }: CardRootProps) {
  return (
    <CardSizeContext.Provider value={size}>
      <Div data-slot="root" {...props} className={cardRoot({ size })} />
    </CardSizeContext.Provider>
  )
}

function CardTitle(props: H3Props) {
  const size = useContext(CardSizeContext)
  return <H3 data-slot="title" {...props} className={cardTitle({ size })} />
}

function CardBody(props: PProps) {
  return <P data-slot="body" {...props} className={cardBody} />
}

const Card = { Root: CardRoot, Title: CardTitle, Body: CardBody }

export function CardPartsDemo() {
  return (
    <>
      <Card.Root>
        <Card.Title>Starter</Card.Title>
        <Card.Body>One project.</Card.Body>
      </Card.Root>
      <Card.Root size="lg">
        <Card.Title>Team</Card.Title>
        <Card.Body>Every project in one place.</Card.Body>
      </Card.Root>
    </>
  )
}
