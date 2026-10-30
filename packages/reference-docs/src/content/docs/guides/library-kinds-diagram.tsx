// Library kinds diagram: the three kinds of component in @reference-ui/lib, side by side.
// It takes nothing and emits one card per kind (icon, name, summary, example components)
// for the Library components guide. Colocated with the page that embeds it.
// Panels stay neutral gray; each kind's icon tile and chips carry its tone (violet, blue, green).
import type { ComponentType } from 'react'
import { Div, Span, css } from '@reference-ui/react'
import { AccessibilityNewIcon, ExtensionIcon, LayersIcon } from '@reference-ui/lib'
import { Diagram } from '../../../components/diagram/Diagram'

/**
 * The Library components > What's in the library figure: Foundations,
 * Accessibility and Utilities as three neutral cards on the kit's
 * page. Each card is a header (an icon tile beside the kind's name,
 * tall enough for a two-line name so the summaries stay level), a short
 * summary, and its example components as code chips pinned to the card's foot
 * so the chip rows line up. Below 560px of container width the cards stack
 * into one column.
 */

const frame = css({ container: true, marginY: '6r' })

const grid = css({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: '3r',
  r: { 560: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } },
})

const header = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2.5r',
  minHeight: '10r',
  marginBottom: '1r',
})

const iconTile = css({
  flexShrink: '0',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '9r',
  height: '9r',
  borderRadius: 'md',
})

const name = css({
  fontSize: '3.75r',
  weight: 'sans.semibold',
  letterSpacing: '-0.01em',
  lineHeight: '1.25',
  color: 'docsText',
})

const summary = css({
  fontSize: '3.5r',
  lineHeight: '1.5',
  color: 'docsText',
})

const chips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5r',
  marginTop: 'auto',
  paddingTop: '2r',
})

const chip = css({
  fontFamily: 'mono',
  fontSize: '3.25r',
  lineHeight: '1.4',
  borderRadius: 'sm',
  paddingX: '1.5r',
  paddingY: '0.5r',
})

type Tone = 'violet' | 'blue' | 'green'

/* Tone ink on a tint over the neutral panel: icons and chip text share one ink (700 light,
 * 200 dark); the tile's tint is a step louder than the chip's. */
const toneTile: Record<Tone, string> = {
  violet: css({ bg: 'violet.500/firm', color: 'violet.700', _dark: { color: 'violet.200' } }),
  blue: css({ bg: 'blue.500/firm', color: 'blue.700', _dark: { color: 'blue.200' } }),
  green: css({ bg: 'green.500/firm', color: 'green.700', _dark: { color: 'green.200' } }),
}

const toneInk: Record<Tone, string> = {
  violet: css({ color: 'violet.700', _dark: { color: 'violet.200' } }),
  blue: css({ color: 'blue.700', _dark: { color: 'blue.200' } }),
  green: css({ color: 'green.700', _dark: { color: 'green.200' } }),
}

const toneChip: Record<Tone, string> = {
  violet: css({ bg: 'violet.500/medium' }),
  blue: css({ bg: 'blue.500/medium' }),
  green: css({ bg: 'green.500/medium' }),
}

type Kind = {
  icon: ComponentType<{ size?: string }>
  title: string
  tone: Tone
  summary: string
  examples: string[]
}

const kinds: Kind[] = [
  {
    icon: LayersIcon,
    title: 'Foundations',
    tone: 'violet',
    summary: 'Layering and positioning, focus and dismissal included. Most patterns start here.',
    examples: ['Portal', 'Overlay', 'Popover'],
  },
  {
    icon: AccessibilityNewIcon,
    title: 'Accessibility',
    tone: 'blue',
    summary: 'WAI-ARIA keyboard, focus and roles.',
    examples: ['Combobox', 'Menu', 'Tabs', 'Tree'],
  },
  {
    icon: ExtensionIcon,
    title: 'Utilities',
    tone: 'green',
    summary: 'Small parts the rest are made of: prop merging, exit animation, arrow-key focus.',
    examples: ['Slot', 'Presence', 'RovingFocus'],
  },
]

function KindCard({ kind }: { kind: Kind }) {
  const Icon = kind.icon
  return (
    <Diagram.Panel align="start">
      <Div className={header}>
        <Span className={`${iconTile} ${toneTile[kind.tone]}`} aria-hidden="true">
          <Icon size="5r" />
        </Span>
        <Span className={name}>{kind.title}</Span>
      </Div>
      <Span className={summary}>{kind.summary}</Span>
      <Div className={chips}>
        {kind.examples.map((example) => (
          <Span key={example} className={`${chip} ${toneChip[kind.tone]} ${toneInk[kind.tone]}`}>
            {example}
          </Span>
        ))}
        <Span className={`${chip} ${toneChip[kind.tone]} ${toneInk[kind.tone]}`}>...</Span>
      </Div>
    </Diagram.Panel>
  )
}

export function LibraryKindsDiagram() {
  return (
    <Div className={frame}>
      <Diagram>
        <Div className={grid}>
          {kinds.map((kind) => (
            <KindCard key={kind.title} kind={kind} />
          ))}
        </Div>
      </Diagram>
    </Div>
  )
}
