import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import { useMeasure } from '../../core/measure/use-measure'

type LegacyDom = {
  render: (node: React.ReactNode, container: Element) => void
  unmountComponentAtNode: (container: Element) => boolean
}

// The react-17 CT runtime aliases react-dom/client to a shim without
// createRoot: fall back to legacy render there. Same tree either way.
function renderInto(node: React.ReactNode, container: Element): () => void {
  if (typeof createRoot === 'function') {
    const root = createRoot(container)
    root.render(node)
    return () => root.unmount()
  }
  const legacy = ReactDOM as unknown as LegacyDom
  legacy.render(node, container)
  return () => {
    legacy.unmountComponentAtNode(container)
  }
}

function MeasuredHost({
  testId,
  pad,
  wide,
  paused,
  scaled,
  hidden,
}: {
  testId: string
  pad: boolean
  wide: boolean
  paused: boolean
  scaled: boolean
  hidden: boolean
}) {
  const { ref, rect, isSettled } = useMeasure<HTMLDivElement>({ paused })
  return (
    <div
      ref={ref}
      data-testid={testId}
      data-settled={isSettled ? 'yes' : 'no'}
      data-width={rect ? String(Math.round(rect.width)) : ''}
      data-height={rect ? String(Math.round(rect.height)) : ''}
      data-top={rect ? String(Math.round(rect.top)) : ''}
      data-left={rect ? String(Math.round(rect.left)) : ''}
      style={{
        width: wide ? 200 : 100,
        height: 40,
        padding: pad ? 20 : 0,
        boxSizing: 'content-box',
        background: '#888',
        transform: scaled ? 'scale(1.5)' : undefined,
        transformOrigin: 'top left',
        display: hidden ? 'none' : undefined,
      }}
    />
  )
}

function LoopHost() {
  const { ref, rect, isSettled } = useMeasure<HTMLDivElement>()
  const width = rect ? Math.min(rect.width, 80) : 200
  return (
    <div
      ref={ref}
      data-testid="measure-loop-host"
      data-settled={isSettled ? 'yes' : 'no'}
      data-width={rect ? String(Math.round(rect.width)) : ''}
      style={{
        width,
        height: 40,
        boxSizing: 'border-box',
        background: '#666',
      }}
    />
  )
}

function IframeHost() {
  const { ref, rect, isSettled } = useMeasure<HTMLDivElement>()
  return (
    <div
      ref={ref}
      data-testid="measure-iframe-host"
      data-settled={isSettled ? 'yes' : 'no'}
      data-width={rect ? String(Math.round(rect.width)) : ''}
      data-top={rect ? String(Math.round(rect.top)) : ''}
      data-left={rect ? String(Math.round(rect.left)) : ''}
      style={{ width: 100, height: 40, margin: 0, background: '#888' }}
    />
  )
}

export function MeasureFixture() {
  const [pad, setPad] = React.useState(false)
  const [wide, setWide] = React.useState(false)
  const [paused, setPaused] = React.useState(false)
  const [scaled, setScaled] = React.useState(false)
  const [hidden, setHidden] = React.useState(false)
  const [mounted, setMounted] = React.useState(true)
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null)
  const iframeRootRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    const frame = iframeRef.current
    if (!frame) return

    const mount = () => {
      const doc = frame.contentDocument
      if (!doc) return
      doc.body.style.margin = '0'
      doc.body.replaceChildren()
      const node = doc.createElement('div')
      doc.body.append(node)
      iframeRootRef.current = renderInto(<IframeHost />, node)
    }

    if (frame.contentDocument?.readyState === 'complete') mount()
    else frame.addEventListener('load', mount)
    return () => {
      frame.removeEventListener('load', mount)
      iframeRootRef.current?.()
      iframeRootRef.current = null
    }
  }, [])

  return (
    <div data-testid="measure-fixture-root" style={{ padding: 16 }}>
      {mounted ? (
        <MeasuredHost
          testId="measure-host"
          pad={pad}
          wide={wide}
          paused={paused}
          scaled={scaled}
          hidden={hidden}
        />
      ) : null}
      <LoopHost />
      <iframe
        ref={iframeRef}
        data-testid="measure-iframe"
        title="measure-iframe"
        style={{ width: 240, height: 80, border: 0, marginTop: 80 }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button type="button" data-testid="measure-pad" onClick={() => setPad(value => !value)}>
          pad
        </button>
        <button type="button" data-testid="measure-wide" onClick={() => setWide(value => !value)}>
          wide
        </button>
        <button type="button" data-testid="measure-pause" onClick={() => setPaused(value => !value)}>
          pause
        </button>
        <button type="button" data-testid="measure-scale" onClick={() => setScaled(value => !value)}>
          scale
        </button>
        <button type="button" data-testid="measure-hide" onClick={() => setHidden(value => !value)}>
          hide
        </button>
        <button type="button" data-testid="measure-unmount" onClick={() => setMounted(value => !value)}>
          unmount
        </button>
      </div>
    </div>
  )
}

export const Fixture = MeasureFixture
