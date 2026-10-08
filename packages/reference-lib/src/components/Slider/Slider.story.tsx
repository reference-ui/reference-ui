import * as React from 'react'
import { createPortal } from 'react-dom'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Slider } from './index'

export const SingleSliderFixture = () => {
  const [value, setValue] = React.useState(30)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="slider-fixture-root">
        <Div style={{ width: 300, margin: '24px 0' }}>
          <Slider
            data-testid="test-slider"
            value={value}
            onChange={setValue}
            min={0}
            max={100}
            step={5}
          >
            <Slider.Track data-testid="slider-track">
              <Slider.Range data-testid="slider-range" />
              <Slider.Thumb data-testid="slider-thumb" />
            </Slider.Track>
          </Slider>

          <Span fontSize="3r" color="design.text.light" data-testid="slider-value-display">
            Current value: {value}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const RangeSliderFixture = () => {
  const [rangeValue, setRangeValue] = React.useState<number | number[]>([20, 80])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="range-slider-root">
        <Div style={{ width: 300, margin: '24px 0' }}>
          <Slider
            data-testid="range-slider"
            value={rangeValue}
            onChange={setRangeValue}
            min={0}
            max={100}
            step={5}
          >
            <Slider.Track data-testid="range-track">
              <Slider.Range data-testid="range-range" />
              <Slider.Thumb data-testid="range-thumb-0" />
              <Slider.Thumb data-testid="range-thumb-1" />
            </Slider.Track>
          </Slider>
          <Span fontSize="3r" color="design.text.light" data-testid="range-value-display">
            Range: {Array.isArray(rangeValue) ? `${rangeValue[0]} - ${rangeValue[1]}` : rangeValue}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export interface LoggedFixtureProps {
  initial?: number | number[]
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  disabled?: boolean
  width?: number
  height?: number
  labels?: string[]
}

export const LoggedFixture = (props: LoggedFixtureProps) => {
  const {
    initial = 20,
    min = 0,
    max = 100,
    step = 1,
    minStepsBetweenThumbs = 0,
    orientation = 'horizontal',
    dir = 'ltr',
    disabled = false,
    width = 300,
    height,
    labels,
  } = props
  const [value, setValue] = React.useState<number | number[]>(initial)
  const [changes, setChanges] = React.useState<string[]>([])
  const [ends, setEnds] = React.useState<string[]>([])
  const thumbCount = Array.isArray(initial) ? initial.length : 1

  return (
    <ReferenceLibrary>
      <Div p="4r" data-testid="logged-root">
        <div dir={dir} style={{ width, height, margin: '24px 0' }}>
          <Slider
            data-testid="logged-slider"
            value={value}
            onChange={v => {
              setChanges(c => [...c, JSON.stringify(v)])
              setValue(v)
            }}
            onChangeEnd={v => {
              setEnds(c => [...c, JSON.stringify(v)])
            }}
            min={min}
            max={max}
            step={step}
            minStepsBetweenThumbs={minStepsBetweenThumbs}
            orientation={orientation}
            disabled={disabled}
          >
            <Slider.Track data-testid="logged-track">
              <Slider.Range data-testid="logged-range" />
              {Array.from({ length: thumbCount }, (_, i) => (
                <Slider.Thumb
                  key={i}
                  data-testid={`logged-thumb-${i}`}
                  aria-label={labels?.[i] ?? `T${i}`}
                />
              ))}
            </Slider.Track>
          </Slider>
          <div data-testid="logged-changes">{JSON.stringify(changes.map(c => JSON.parse(c)))}</div>
          <div data-testid="logged-ends">{JSON.stringify(ends.map(e => JSON.parse(e)))}</div>
          <div data-testid="logged-value">{JSON.stringify(value)}</div>
        </div>
      </Div>
    </ReferenceLibrary>
  )
}

export const ConstraintFixture = () => {
  const [config, setConfig] = React.useState({
    value: 20 as number | number[],
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal' as 'horizontal' | 'vertical',
    dir: 'ltr' as 'ltr' | 'rtl',
    disabled: false,
  })
  const [handlerId, setHandlerId] = React.useState('A')
  const [changes, setChanges] = React.useState<string[]>([])
  const [ends, setEnds] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="4r" data-testid="constraint-root">
        <button
          data-testid="constraint-swap"
          onClick={() => {
            setHandlerId('B')
            setConfig(c => ({ ...c, value: 30, max: 60, step: 5 }))
          }}
        >
          swap handler + bounds
        </button>
        <button
          data-testid="constraint-update"
          onClick={() => {
            setConfig(c => ({ ...c, min: 10, max: 60, step: 5, orientation: 'vertical', dir: 'rtl' }))
          }}
        >
          update constraints
        </button>
        <button data-testid="constraint-disable" onClick={() => setConfig(c => ({ ...c, disabled: !c.disabled }))}>
          toggle disabled
        </button>
        <div dir={config.dir} style={{ width: 300, height: 200, margin: '24px 0' }}>
          <Slider
            data-testid="constraint-slider"
            value={config.value}
            onChange={v => {
              setChanges(c => [...c, `${handlerId}:${JSON.stringify(v)}`])
              setConfig(c => ({ ...c, value: v as number }))
            }}
            onChangeEnd={v => {
              setEnds(c => [...c, `${handlerId}:${JSON.stringify(v)}`])
            }}
            min={config.min}
            max={config.max}
            step={config.step}
            orientation={config.orientation}
            disabled={config.disabled}
          >
            <Slider.Track data-testid="constraint-track">
              <Slider.Range data-testid="constraint-range" />
              <Slider.Thumb data-testid="constraint-thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
          <div data-testid="constraint-changes">{JSON.stringify(changes)}</div>
          <div data-testid="constraint-ends">{JSON.stringify(ends)}</div>
        </div>
      </Div>
    </ReferenceLibrary>
  )
}

export const CardinalityFixture = () => {
  const [value, setValue] = React.useState<number[]>([10, 20, 30])
  const [changes, setChanges] = React.useState<string[]>([])
  const [ends, setEnds] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="4r" data-testid="cardinality-root">
        <button data-testid="cardinality-shrink" onClick={() => setValue([10, 20])}>
          shrink
        </button>
        <button data-testid="cardinality-grow" onClick={() => setValue([10, 20, 30])}>
          grow
        </button>
        <div style={{ width: 300, margin: '24px 0' }}>
          <Slider
            data-testid="cardinality-slider"
            value={value}
            onChange={v => {
              setChanges(c => [...c, JSON.stringify(v)])
              setValue(v as number[])
            }}
            onChangeEnd={v => {
              setEnds(c => [...c, JSON.stringify(v)])
            }}
            min={0}
            max={100}
            step={1}
          >
            <Slider.Track data-testid="cardinality-track">
              <Slider.Range data-testid="cardinality-range" />
              {value.map((_, i) => (
                <Slider.Thumb key={i} data-testid={`cardinality-thumb-${i}`} aria-label={`T${i}`} />
              ))}
            </Slider.Track>
          </Slider>
          <div data-testid="cardinality-changes">{JSON.stringify(changes.map(c => JSON.parse(c)))}</div>
          <div data-testid="cardinality-ends">{JSON.stringify(ends.map(e => JSON.parse(e)))}</div>
        </div>
      </Div>
    </ReferenceLibrary>
  )
}

export const ZeroTrackFixture = () => {
  const [revealed, setRevealed] = React.useState(false)
  const [value, setValue] = React.useState(20)
  const [changes, setChanges] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="4r" data-testid="zero-root">
        <button data-testid="zero-reveal" onClick={() => setRevealed(true)}>
          reveal
        </button>
        <div style={{ width: 100, display: revealed ? 'block' : 'none' }}>
          <Slider
            data-testid="zero-slider"
            value={value}
            onChange={v => {
              setChanges(c => [...c, JSON.stringify(v)])
              setValue(v as number)
            }}
            min={0}
            max={100}
            step={1}
          >
            <Slider.Track data-testid="zero-track">
              <Slider.Range data-testid="zero-range" />
              <Slider.Thumb data-testid="zero-thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
        </div>
        <div data-testid="zero-changes">{JSON.stringify(changes.map(c => JSON.parse(c)))}</div>
        <div data-testid="zero-value">{value}</div>
      </Div>
    </ReferenceLibrary>
  )
}

export const A11yFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" data-testid="a11y-root">
      <div style={{ width: 300 }}>
        <Slider value={30} onChange={() => {}}>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb data-testid="a11y-scalar-thumb" aria-label="Volume" />
          </Slider.Track>
        </Slider>
        <Slider value={[20, 70]} onChange={() => {}}>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb data-testid="a11y-range-0" aria-label="Min price" />
            <Slider.Thumb data-testid="a11y-range-1" aria-label="Max price" />
          </Slider.Track>
        </Slider>
        <Slider value={50} onChange={() => {}} disabled>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb data-testid="a11y-disabled-thumb" aria-label="Disabled" />
          </Slider.Track>
        </Slider>
        <div style={{ height: 120 }}>
          <Slider value={40} onChange={() => {}} orientation="vertical">
            <Slider.Track>
              <Slider.Range />
              <Slider.Thumb data-testid="a11y-vert-thumb" aria-label="Vertical" />
            </Slider.Track>
          </Slider>
        </div>
        <div dir="rtl">
          <Slider value={60} onChange={() => {}}>
            <Slider.Track>
              <Slider.Range />
              <Slider.Thumb data-testid="a11y-rtl-thumb" aria-label="Rtl" />
            </Slider.Track>
          </Slider>
        </div>
      </div>
    </Div>
  </ReferenceLibrary>
)

export const StrictFixture = () => {
  const [value, setValue] = React.useState(20)
  const [changes, setChanges] = React.useState<string[]>([])
  const [ends, setEnds] = React.useState<string[]>([])
  return (
    <React.StrictMode>
      <ReferenceLibrary>
        <Div p="4r" data-testid="strict-root">
          <div style={{ width: 300, margin: '24px 0' }}>
            <Slider
              data-testid="strict-slider"
              value={value}
              onChange={v => {
                setChanges(c => [...c, JSON.stringify(v)])
                setValue(v as number)
              }}
              onChangeEnd={v => {
                setEnds(c => [...c, JSON.stringify(v)])
              }}
              min={0}
              max={100}
              step={1}
            >
              <Slider.Track data-testid="strict-track">
                <Slider.Range data-testid="strict-range" />
                <Slider.Thumb data-testid="strict-thumb" aria-label="T" />
              </Slider.Track>
            </Slider>
            <div data-testid="strict-changes">{JSON.stringify(changes.map(c => JSON.parse(c)))}</div>
            <div data-testid="strict-ends">{JSON.stringify(ends.map(e => JSON.parse(e)))}</div>
          </div>
        </Div>
      </ReferenceLibrary>
    </React.StrictMode>
  )
}

export const ShadowFixture = (props: { dirOnHost?: boolean }) => {
  const { dirOnHost = false } = props
  const hostRef = React.useRef<HTMLDivElement>(null)
  const [portalTarget, setPortalTarget] = React.useState<HTMLDivElement | null>(null)
  const [value, setValue] = React.useState<number[]>([20, 80])
  const [changes, setChanges] = React.useState<string[]>([])
  const [ends, setEnds] = React.useState<string[]>([])

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    let container = shadow.querySelector('[data-testid="shadow-inner"]') as HTMLDivElement | null
    if (!container) {
      container = document.createElement('div')
      container.setAttribute('data-testid', 'shadow-inner')
      if (!dirOnHost) container.setAttribute('dir', 'rtl')
      container.setAttribute('style', 'width: 200px;')
      shadow.appendChild(container)
    }
    setPortalTarget(container)
  }, [dirOnHost])

  return (
    <ReferenceLibrary>
      <Div p="4r" data-testid="shadow-root">
        <div
          data-testid="shadow-host"
          ref={hostRef}
          dir={dirOnHost ? 'rtl' : undefined}
          style={{ width: 300, margin: '24px 0' }}
        />
        {portalTarget &&
          createPortal(
            <Slider
              data-testid="shadow-slider"
              value={value}
              onChange={v => {
                setChanges(c => [...c, JSON.stringify(v)])
                setValue(v as number[])
              }}
              onChangeEnd={v => {
                setEnds(c => [...c, JSON.stringify(v)])
              }}
              min={0}
              max={100}
              step={1}
            >
              <Slider.Track data-testid="shadow-track">
                <Slider.Range data-testid="shadow-range" />
                <Slider.Thumb data-testid="shadow-thumb-0" aria-label="ShadowMin" />
                <Slider.Thumb data-testid="shadow-thumb-1" aria-label="ShadowMax" />
              </Slider.Track>
            </Slider>,
            portalTarget
          )}
        <div data-testid="shadow-changes">{JSON.stringify(changes.map(c => JSON.parse(c)))}</div>
        <div data-testid="shadow-ends">{JSON.stringify(ends.map(e => JSON.parse(e)))}</div>
        <div data-testid="shadow-value">{JSON.stringify(value)}</div>
      </Div>
    </ReferenceLibrary>
  )
}

class DiagBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch() {}
  render() {
    if (this.state.error) {
      return <div data-testid="diag-error">{String(this.state.error.message)}</div>
    }
    return this.props.children
  }
}

export const DiagFixture = () => {
  const [mode, setMode] = React.useState<'ok' | 'dup-track' | 'dup-range' | 'bad-array'>('ok')
  const [changes, setChanges] = React.useState(0)
  return (
    <ReferenceLibrary>
      <Div p="4r" data-testid="diag-root">
        <button data-testid="diag-dup-track" onClick={() => setMode('dup-track')}>
          dup track
        </button>
        <button data-testid="diag-dup-range" onClick={() => setMode('dup-range')}>
          dup range
        </button>
        <button data-testid="diag-bad-array" onClick={() => setMode('bad-array')}>
          bad array
        </button>
        <div style={{ width: 300 }}>
          <DiagBoundary key={mode}>
            {mode === 'ok' && (
              <Slider value={20} onChange={() => setChanges(c => c + 1)}>
                <Slider.Track>
                  <Slider.Range />
                  <Slider.Thumb aria-label="T" />
                </Slider.Track>
              </Slider>
            )}
            {mode === 'dup-track' && (
              <Slider value={20}>
                <Slider.Track>
                  <Slider.Range />
                  <Slider.Thumb aria-label="T" />
                </Slider.Track>
                <Slider.Track>
                  <Slider.Thumb aria-label="T2" />
                </Slider.Track>
              </Slider>
            )}
            {mode === 'dup-range' && (
              <Slider value={20}>
                <Slider.Track>
                  <Slider.Range />
                  <Slider.Range />
                  <Slider.Thumb aria-label="T" />
                </Slider.Track>
              </Slider>
            )}
            {mode === 'bad-array' && (
              <Slider value={[40, 60]} min={0} max={100} step={10} minStepsBetweenThumbs={3}>
                <Slider.Track>
                  <Slider.Range />
                  <Slider.Thumb aria-label="Min" />
                  <Slider.Thumb aria-label="Max" />
                </Slider.Track>
              </Slider>
            )}
          </DiagBoundary>
        </div>
        <div data-testid="diag-changes">{changes}</div>
      </Div>
    </ReferenceLibrary>
  )
}
