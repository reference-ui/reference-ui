import { Div, Span, css } from '@reference-ui/react'

/**
 * Accent specimens for the Colour page: a blue tinted surface with one accent
 * in either blue or amber, and the four relationships of an accent to blue.
 * Accents are static classes, never computed names, so the compiler extracts
 * them. Hues are placed by their OKLCH hue: amber.500 sits about 170 degrees
 * from blue.500, the nearest thing to its complement in the palette.
 */

type Accent = 'blue' | 'amber'
type Target = 'blue.800' | 'violet.500' | 'amber.500' | 'orange.500'
type Relationship = { key: string; title: string; caption: string; target: Target }

const grid = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '4r',
  marginBottom: '4r',
  r: { 640: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
})

const surfaceCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3r',
  padding: '5r',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  bg: 'blue.500/medium',
  borderColor: 'blue.500/medium',
})

const cardHead = css({ display: 'flex', alignItems: 'center', gap: '3r' })

const dot = css({ width: '3r', height: '3r', borderRadius: 'full', flexShrink: '0' })

const accentDot: Record<Accent, string> = {
  blue: css({ bg: 'blue.400' }),
  amber: css({ bg: 'amber.500' }),
}

const accentFill: Record<Accent, string> = {
  blue: css({ bg: 'blue.400' }),
  amber: css({ bg: 'amber.500' }),
}

const meterTrack = css({ height: '2r', borderRadius: 'full', bg: 'blue.500/firm' })

const meterFill = css({ height: '2r', width: '62%', borderRadius: 'full' })

const cardTitle = css({ fontSize: '4r', fontWeight: '600', color: 'docsText', lineHeight: '1.3' })

const cardSub = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

function AccentCard({ accent, caption }: { accent: Accent; caption: string }) {
  return (
    <Div className={surfaceCard}>
      <Div className={cardHead}>
        <Div className={`${dot} ${accentDot[accent]}`} />
        <Span className={cardTitle}>Input</Span>
      </Div>
      <Div className={meterTrack}>
        <Div className={`${meterFill} ${accentFill[accent]}`} />
      </Div>
      <Span className={cardSub}>{caption}</Span>
    </Div>
  )
}

/** One blue surface, twice: every accent blue, then one amber accent beside it. */
export function ComplementaryCards() {
  return (
    <Div className={grid}>
      <AccentCard accent="blue" caption="All blue · quiet and cohesive" />
      <AccentCard accent="amber" caption="Blue with amber · warm against cool" />
    </Div>
  )
}

const RELATIONSHIPS: Relationship[] = [
  {
    key: 'monochromatic',
    title: 'Monochromatic',
    caption: 'The same hue at another step. Calm and cohesive.',
    target: 'blue.800',
  },
  {
    key: 'analogous',
    title: 'Analogous',
    caption: 'Neighbouring hues on the wheel. Harmonious, with more character.',
    target: 'violet.500',
  },
  {
    key: 'complementary',
    title: 'Complementary',
    caption: 'The opposite hue. The strongest contrast, so use it sparingly.',
    target: 'amber.500',
  },
  {
    key: 'split',
    title: 'Split complementary',
    caption: 'Two hues either side of the opposite. Contrast with less tension.',
    target: 'orange.500',
  },
]

const relCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3r',
  padding: '4r',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'docsBorder',
})

const stage = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3r',
  height: '12r',
  padding: '0 4r',
  borderRadius: 'md',
  bg: 'blue.500/medium',
})

const sourceDot = css({ width: '3r', height: '3r', borderRadius: 'full', bg: 'blue.400', flexShrink: '0' })

const rule = css({
  flex: '1 1 auto',
  height: '0',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'blue.500/strong',
})

const targetDot: Record<Target, string> = {
  'blue.800': css({ width: '3r', height: '3r', borderRadius: 'full', flexShrink: '0', bg: 'blue.800' }),
  'violet.500': css({ width: '3r', height: '3r', borderRadius: 'full', flexShrink: '0', bg: 'violet.500' }),
  'amber.500': css({ width: '3r', height: '3r', borderRadius: 'full', flexShrink: '0', bg: 'amber.500' }),
  'orange.500': css({ width: '3r', height: '3r', borderRadius: 'full', flexShrink: '0', bg: 'orange.500' }),
}

function RelationshipCard({ relationship }: { relationship: Relationship }) {
  return (
    <Div className={relCard}>
      <Div className={stage}>
        <Div className={sourceDot} />
        <Div className={rule} />
        <Div className={targetDot[relationship.target]} />
      </Div>
      <Span className={cardTitle}>{relationship.title}</Span>
      <Span className={cardSub}>{relationship.caption}</Span>
    </Div>
  )
}

/** The four relationships, each a blue source paired with its target hue. */
export function RelationshipGrid() {
  return (
    <Div className={grid}>
      {RELATIONSHIPS.map(relationship => (
        <RelationshipCard key={relationship.key} relationship={relationship} />
      ))}
    </Div>
  )
}
