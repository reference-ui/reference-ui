import { ShieldIcon } from '@reference-ui/lib'
import { Div, Span, css } from '@reference-ui/react'
import { Diagram } from '../../components/diagram/Diagram'

/**
 * A pipeline excerpt: numbered stages, nested panels, code blocks, a dashed
 * compilation boundary, and a green result strip. Panels nest inside panels
 * through ordinary rows; only the canvas stays singular. Arrow labels name
 * each handoff so the flow reads without prose.
 */

const canvasHead = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })

const canvasTitle = css({ fontSize: '4r', fontWeight: '600', color: 'docsText', lineHeight: '1.4' })

const canvasRange = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.4' })

const stageHead = css({ display: 'flex', alignItems: 'center', gap: '3r' })

const stageNo = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  fontWeight: '600',
  color: 'docsText',
  bg: 'color-mix(in oklch, black 18%, var(--colors-diagram-panel))',
  paddingX: '2r',
  paddingY: '1r',
  borderRadius: 'sm',
  lineHeight: '1.4',
})

const stageTitle = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const spacer = css({ flex: '1' })

const stageTag = css({
  fontSize: 'sm',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'docsMuted',
  lineHeight: '1.4',
})

const cardTitle = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const cardSub = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

const codeBlock = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'docsText',
  bg: 'color-mix(in oklch, black 22%, var(--colors-diagram-panel))',
  borderRadius: 'sm',
  padding: '3r',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
})

const miniName = css({ fontSize: 'sm', fontWeight: '600', color: 'docsText', lineHeight: '1.4' })

const miniSub = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.4' })

const boundaryTitle = css({
  fontSize: '5r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'diagramAmberText',
  lineHeight: '1.3',
})

const boundaryText = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.6' })

export function PipelineExcerpt() {
  return (
    <Diagram>
      <Div className={canvasHead}>
        <Span className={canvasTitle}>Reference UI pipeline</Span>
        <Span className={canvasRange}>01 — 05</Span>
      </Div>

      <Diagram.Column>
        <Diagram.Panel>
          <Div className={stageHead}>
            <Span className={stageNo}>01</Span>
            <Span className={stageTitle}>Authoring surface</Span>
            <Div className={spacer} />
            <Span className={stageTag}>Developer input</Span>
          </Div>
          <Diagram.Row>
            <Diagram.Panel>
              <Span className={cardTitle}>Component source</Span>
              <Div className={codeBlock}>{'<Div\n  color="gray.100"\n  p="4"\n/>'}</Div>
              <Span className={cardSub}>React and style props</Span>
            </Diagram.Panel>
            <Diagram.Panel>
              <Span className={cardTitle}>Style definitions</Span>
              <Div className={codeBlock}>{'css()\nfont()\ntokens()'}</Div>
              <Span className={cardSub}>Recipes and tokens</Span>
            </Diagram.Panel>
          </Diagram.Row>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" label="ref sync" />

        <Diagram.Panel tone="blue">
          <Div className={stageHead}>
            <Span className={stageNo}>02</Span>
            <Span className={stageTitle}>Compiler pipeline</Span>
            <Div className={spacer} />
            <Span className={stageTag}>Rust + Oxc</Span>
          </Div>
          <Diagram.Row>
            <Diagram.Panel align="center">
              <Span className={miniName}>Resolve tokens</Span>
              <Span className={miniSub}>Theme values</Span>
            </Diagram.Panel>
            <Diagram.Panel align="center">
              <Span className={miniName}>Generate rules</Span>
              <Span className={miniSub}>Atomic CSS</Span>
            </Diagram.Panel>
            <Diagram.Panel align="center">
              <Span className={miniName}>Deduplicate</Span>
              <Span className={miniSub}>Stable rules</Span>
            </Diagram.Panel>
          </Diagram.Row>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" label="Artifact generation" />

        <Diagram.Panel tone="amber" variant="outline" align="center">
          <ShieldIcon size="lg" color="diagramAmberText" />
          <Span className={boundaryTitle}>Compilation boundary</Span>
          <Span className={boundaryText}>
            Compiled styling ships as static output. The browser never repeats the work.
          </Span>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" label="Build / runtime boundary" />

        <Diagram.Panel tone="green">
          <Diagram.Row>
            <Diagram.Panel align="center">
              <Span className={miniName}>Precompiled</Span>
              <Span className={miniSub}>Styling</Span>
            </Diagram.Panel>
            <Diagram.Panel align="center">
              <Span className={miniName}>Compact</Span>
              <Span className={miniSub}>Output</Span>
            </Diagram.Panel>
            <Diagram.Panel align="center">
              <Span className={miniName}>Native</Span>
              <Span className={miniSub}>Rendering</Span>
            </Diagram.Panel>
          </Diagram.Row>
        </Diagram.Panel>
      </Diagram.Column>
    </Diagram>
  )
}
