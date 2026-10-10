import { HandymanIcon, PaletteIcon, TuneIcon, WidgetsIcon } from '@reference-ui/lib'
import { Span, css } from '@reference-ui/react'
import { Diagram } from '../../components/diagram/Diagram'

/**
 * One workflow, four payoffs. The tinted command block states the entry
 * point; the arrow drops into a two-by-two of centered outcome cards. Rows
 * inside a column give the grid without a grid primitive.
 */

const eyebrow = css({
  fontSize: 'sm',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'docsMuted',
  lineHeight: '1.4',
})

const command = css({
  fontFamily: 'mono',
  fontSize: '6r',
  fontWeight: '600',
  color: 'docsText',
  lineHeight: '1.2',
})

const lede = css({ fontSize: '4r', color: 'docsMuted', lineHeight: '1.5' })

const cardTitle = css({
  fontSize: '5r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const cardSub = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

export function SyncOverview() {
  return (
    <Diagram>
      <Diagram.Column>
        <Diagram.Panel tone="blue" align="center">
          <Span className={eyebrow}>Your project</Span>
          <Span className={command}>ref sync</Span>
          <Span className={lede}>One command to bring everything together</Span>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" />

        <Diagram.Row>
          <Diagram.Panel align="center">
            <WidgetsIcon size="lg" className={css({ color: 'docsText' })} />
            <Span className={cardTitle}>Components</Span>
            <Span className={cardSub}>Ready to use</Span>
          </Diagram.Panel>
          <Diagram.Panel align="center">
            <PaletteIcon size="lg" className={css({ color: 'docsText' })} />
            <Span className={cardTitle}>Styles</Span>
            <Span className={cardSub}>Generated for your app</Span>
          </Diagram.Panel>
        </Diagram.Row>

        <Diagram.Row>
          <Diagram.Panel align="center">
            <TuneIcon size="lg" className={css({ color: 'docsText' })} />
            <Span className={cardTitle}>Tokens</Span>
            <Span className={cardSub}>Consistent design values</Span>
          </Diagram.Panel>
          <Diagram.Panel align="center">
            <HandymanIcon size="lg" className={css({ color: 'docsText' })} />
            <Span className={cardTitle}>Tooling</Span>
            <Span className={cardSub}>Integrated workflow</Span>
          </Diagram.Panel>
        </Diagram.Row>
      </Diagram.Column>
    </Diagram>
  )
}
