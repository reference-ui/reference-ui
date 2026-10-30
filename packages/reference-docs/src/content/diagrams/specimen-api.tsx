// API example specimen for the /diagram gallery.
// It takes nothing and emits the whole kit in one figure: canvas, row, two panels, one
// arrow. Titles, icons, code, and badge are ordinary components Diagram owns none of.
import { CodeIcon, PackageIcon } from '@reference-ui/lib'
import { Code, Span, css } from '@reference-ui/react'
import { Diagram } from '../../components/diagram/Diagram'

/**
 * The whole API in one diagram: canvas, row, two panels, one arrow. Titles,
 * icons, code, and the badge are ordinary components — Diagram owns none of
 * them. Chips and pills hug their content with alignSelf; everything else
 * stretches to the panel edge.
 */

const title = css({
  fontSize: '5r',
  weight: 'sans.semibold',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const chip = css({
  fontFamily: 'mono',
  fontSize: '3.5r',
  color: 'docsText',
  bg: 'diagramChip',
  paddingX: '2r',
  paddingY: '1r',
  borderRadius: 'sm',
  alignSelf: 'flex-start',
  lineHeight: '1.5',
})

const pill = css({
  fontSize: '3.5r',
  weight: 'sans.semibold',
  color: 'diagramBlueText',
  bg: 'diagramChip',
  paddingX: '3r',
  paddingY: '1r',
  borderRadius: 'full',
  alignSelf: 'flex-start',
  lineHeight: '1.4',
})

export function ApiExample() {
  return (
    <Diagram>
      <Diagram.Row>
        <Diagram.Panel>
          <CodeIcon size="lg" color="diagramMuted" />
          <Span className={title}>Source</Span>
          <Code className={chip}>{'css({ color: "red.500" })'}</Code>
        </Diagram.Panel>

        <Diagram.Arrow direction="right" />

        <Diagram.Panel>
          <PackageIcon size="lg" color="diagramMuted" />
          <Span className={title}>Compiled output</Span>
          <Span className={pill}>Atomic CSS</Span>
        </Diagram.Panel>
      </Diagram.Row>
    </Diagram>
  )
}
