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
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const chip = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'docsText',
  bg: 'color-mix(in oklch, black 18%, var(--colors-diagram-panel))',
  paddingX: '2r',
  paddingY: '1r',
  borderRadius: 'sm',
  alignSelf: 'flex-start',
  lineHeight: '1.5',
})

const pill = css({
  fontSize: 'sm',
  fontWeight: '600',
  color: 'diagramBlueText',
  bg: 'color-mix(in oklch, var(--colors-blue-500) 14%, transparent)',
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
          <CodeIcon size="lg" color="docsMuted" />
          <Span className={title}>Source</Span>
          <Code className={chip}>{'css({ color: "red.500" })'}</Code>
        </Diagram.Panel>

        <Diagram.Arrow direction="right" />

        <Diagram.Panel>
          <PackageIcon size="lg" color="docsMuted" />
          <Span className={title}>Compiled output</Span>
          <Span className={pill}>Atomic CSS</Span>
        </Diagram.Panel>
      </Diagram.Row>
    </Diagram>
  )
}
