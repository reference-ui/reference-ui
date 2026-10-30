// System introduction diagram: authoring surface, sync, engine, the outputs sync writes.
// It takes nothing and emits the layered architecture figure for the System introduction
// page. Colocated with the page that embeds it.
import { Div, Span, css } from '@reference-ui/react'
import { Diagram } from '../../../components/diagram/Diagram'

/**
 * The System > Introduction diagram: three authoring blocks, `ref sync`, the
 * Rust engine, and the three things sync writes (stylesheet, types,
 * packages), top to bottom. It composes the shared Diagram kit, so it inherits
 * the kit's light and dark palette; every panel is neutral gray. Below 480px of container width each row
 * of blocks stacks into one column.
 */

const frame = css({ container: true, marginBottom: '6r' })

const tier = css({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: '3r',
  r: { 480: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } },
})

const eyebrow = css({
  fontSize: '3r',
  weight: 'sans.semibold',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'diagramMuted',
  lineHeight: '1.4',
})

const title = css({
  fontSize: '4.5r',
  weight: 'sans.semibold',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const chip = css({
  alignSelf: 'flex-start',
  fontFamily: 'mono',
  fontSize: '3.25r',
  lineHeight: '1.4',
  color: 'diagramMuted',
  bg: 'diagramChip',
  borderRadius: 'sm',
  paddingX: '1.5r',
  paddingY: '0.5r',
})

function Block({ name, detail }: { name: string; detail: string }) {
  return (
    <>
      <Span className={title}>{name}</Span>
      <Span className={chip}>{detail}</Span>
    </>
  )
}

export function SystemDiagram() {
  return (
    <Div className={frame}>
      <Diagram>
        <Diagram.Column gap="2r">
          <Span className={eyebrow}>Authoring surface</Span>
          <Div className={tier}>
            <Diagram.Panel>
              <Block name="Style props + primitives" detail={'<Div p="4r">'} />
            </Diagram.Panel>
            <Diagram.Panel>
              <Block name="Tokens" detail="tokens()" />
            </Diagram.Panel>
            <Diagram.Panel>
              <Block name="CSS & JS" detail="css()" />
            </Diagram.Panel>
          </Div>

          <Diagram.Arrow direction="down" label="ref sync" />

          <Diagram.Panel>
            <Block name="Engine (Rust)" detail="compile" />
          </Diagram.Panel>

          <Diagram.Arrow direction="down" />

          <Span className={eyebrow}>Outputs</Span>
          <Div className={tier}>
            <Diagram.Panel>
              <Block name="Stylesheet" detail="styles.css" />
            </Diagram.Panel>
            <Diagram.Panel>
              <Block name="Types" detail=".d.mts" />
            </Diagram.Panel>
            <Diagram.Panel>
              <Block name="Packages" detail="@reference-ui/react" />
            </Diagram.Panel>
          </Div>
        </Diagram.Column>
      </Diagram>
    </Div>
  )
}
