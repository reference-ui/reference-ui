// Arrow gallery specimen for the /diagram gallery.
// It takes nothing and emits the arrow vocabulary: labeled connectors in all four
// directions, vertical labels stacked and horizontal labels beside.
import { Span, css } from '@reference-ui/react'
import { Diagram } from '../../components/diagram/Diagram'

/**
 * Arrows connect and narrate. The label carries the verb — the command run,
 * the handoff made — while the shaft stays quiet. Vertical arrows stack the
 * label under the glyph; horizontal arrows set it beside. The last row shows
 * all four glyphs; down and right carry nearly every real diagram.
 */

const panelTitle = css({
  fontSize: '4r',
  weight: 'sans.semibold',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const panelSub = css({ fontSize: '3.5r', color: 'diagramMuted', lineHeight: '1.5' })

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

const caption = css({ fontSize: '3.5r', color: 'diagramMuted', lineHeight: '1.4' })

export function ArrowGallery() {
  return (
    <Diagram>
      <Diagram.Column>
        <Diagram.Panel>
          <Span className={panelTitle}>Author styles</Span>
          <Span className={chip}>{'css({ … })'}</Span>
        </Diagram.Panel>
        <Diagram.Arrow direction="down" label="ref sync" />
        <Diagram.Panel tone="green">
          <Span className={panelTitle}>Static CSS</Span>
          <Span className={panelSub}>Ready to ship, no runtime cost</Span>
        </Diagram.Panel>
      </Diagram.Column>

      <Diagram.Row>
        <Diagram.Panel>
          <Span className={panelTitle}>Source</Span>
        </Diagram.Panel>
        <Diagram.Arrow direction="right" label="compile" />
        <Diagram.Panel>
          <Span className={panelTitle}>Output</Span>
        </Diagram.Panel>
      </Diagram.Row>

      <Diagram.Row>
        <Diagram.Panel align="center">
          <Diagram.Arrow direction="down" />
          <Span className={caption}>down</Span>
        </Diagram.Panel>
        <Diagram.Panel align="center">
          <Diagram.Arrow direction="up" />
          <Span className={caption}>up</Span>
        </Diagram.Panel>
        <Diagram.Panel align="center">
          <Diagram.Arrow direction="right" />
          <Span className={caption}>right</Span>
        </Diagram.Panel>
        <Diagram.Panel align="center">
          <Diagram.Arrow direction="left" />
          <Span className={caption}>left</Span>
        </Diagram.Panel>
      </Diagram.Row>
    </Diagram>
  )
}
