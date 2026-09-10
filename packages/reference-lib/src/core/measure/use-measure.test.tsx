// @vitest-environment happy-dom
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { MEASUREMENT_SETTLE_TIMEOUT_MS } from './constants'
import { useMeasure } from './use-measure'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

class TrackingResizeObserver {
  static instances: TrackingResizeObserver[] = []
  observed = new Set<Element>()
  options = new Map<Element, ResizeObserverOptions | undefined>()
  constructor(public callback: ResizeObserverCallback) {
    TrackingResizeObserver.instances.push(this)
  }
  observe(element: Element, options?: ResizeObserverOptions) {
    this.observed.add(element)
    this.options.set(element, options)
  }
  unobserve(element: Element) {
    this.observed.delete(element)
  }
  disconnect() {
    this.observed.clear()
  }
  fire() {
    this.callback([] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver)
  }
}

function Probe({
  paused,
  onValue,
}: {
  paused?: boolean
  onValue: (value: { width: number | null; settled: boolean; childCount: number }) => void
}) {
  const measure = useMeasure<HTMLDivElement>({ paused })
  React.useLayoutEffect(() => {
    onValue({
      width: measure.rect?.width ?? null,
      settled: measure.isSettled,
      childCount: 0,
    })
  }, [measure.rect, measure.isSettled, onValue])
  return (
    <div
      ref={el => {
        if (el) {
          el.getBoundingClientRect = () => new DOMRect(8, 16, 120, 40)
        }
        measure.ref(el)
      }}
      data-host=""
    >
      panel
    </div>
  )
}

describe('useMeasure', () => {
  const originalResizeObserver = globalThis.ResizeObserver
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    TrackingResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', TrackingResizeObserver)
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    if (originalResizeObserver) vi.stubGlobal('ResizeObserver', originalResizeObserver)
  })

  it('attaches to the authored element and does not add a wrapper node', async () => {
    await React.act(async () => {
      root.render(<Probe onValue={() => {}} />)
    })
    expect(container.childElementCount).toBe(1)
    expect(container.firstElementChild?.getAttribute('data-host')).toBe('')
    expect(TrackingResizeObserver.instances[0]?.observed.size).toBe(1)
    expect(TrackingResizeObserver.instances[0]?.observed.has(container.firstElementChild!)).toBe(
      true
    )
    expect(TrackingResizeObserver.instances[0]?.options.get(container.firstElementChild!)).toEqual({
      box: 'border-box',
    })
  })

  it('publishes the border box and settles after the quiet window', async () => {
    const values: Array<{ width: number | null; settled: boolean }> = []
    await React.act(async () => {
      root.render(
        <Probe
          onValue={value => {
            values.push({ width: value.width, settled: value.settled })
          }}
        />
      )
    })
    expect(values[values.length - 1]).toEqual({ width: 120, settled: false })
    await React.act(async () => {
      vi.advanceTimersByTime(MEASUREMENT_SETTLE_TIMEOUT_MS)
    })
    expect(values[values.length - 1]).toEqual({ width: 120, settled: true })
  })

  it('resets settle on a real size change and ignores sub-epsilon jitter', async () => {
    let width = 120
    const values: boolean[] = []
    function Jitter() {
      const measure = useMeasure<HTMLDivElement>()
      React.useLayoutEffect(() => {
        values.push(measure.isSettled)
      }, [measure.isSettled])
      return (
        <div
          ref={el => {
            if (el) el.getBoundingClientRect = () => new DOMRect(0, 0, width, 40)
            measure.ref(el)
          }}
        />
      )
    }

    await React.act(async () => {
      root.render(<Jitter />)
    })
    await React.act(async () => {
      vi.advanceTimersByTime(MEASUREMENT_SETTLE_TIMEOUT_MS)
    })
    expect(values[values.length - 1]).toBe(true)

    width = 120.04
    await React.act(async () => {
      TrackingResizeObserver.instances[0]?.fire()
    })
    expect(values[values.length - 1]).toBe(true)

    width = 200
    await React.act(async () => {
      TrackingResizeObserver.instances[0]?.fire()
    })
    expect(values[values.length - 1]).toBe(false)
    await React.act(async () => {
      vi.advanceTimersByTime(MEASUREMENT_SETTLE_TIMEOUT_MS)
    })
    expect(values[values.length - 1]).toBe(true)
  })

  it('does not observe while paused and does not start a rAF loop', async () => {
    const raf = vi.fn()
    vi.stubGlobal('requestAnimationFrame', raf)
    await React.act(async () => {
      root.render(<Probe paused onValue={() => {}} />)
    })
    expect(TrackingResizeObserver.instances[0]?.observed.size ?? 0).toBe(0)
    expect(raf).not.toHaveBeenCalled()

    await React.act(async () => {
      root.render(<Probe paused={false} onValue={() => {}} />)
    })
    expect(TrackingResizeObserver.instances[TrackingResizeObserver.instances.length - 1]?.observed.size).toBe(1)
    expect(raf).not.toHaveBeenCalled()
  })

  it('disconnects on unmount', async () => {
    await React.act(async () => {
      root.render(<Probe onValue={() => {}} />)
    })
    const observer = TrackingResizeObserver.instances[0]!
    expect(observer.observed.size).toBe(1)
    await React.act(async () => {
      root.unmount()
    })
    expect(observer.observed.size).toBe(0)
  })

  it('keeps the last rect while paused', async () => {
    const values: Array<{ width: number | null; settled: boolean }> = []
    const onValue = (value: { width: number | null; settled: boolean; childCount: number }) => {
      values.push({ width: value.width, settled: value.settled })
    }
    await React.act(async () => {
      root.render(<Probe onValue={onValue} />)
    })
    await React.act(async () => {
      vi.advanceTimersByTime(MEASUREMENT_SETTLE_TIMEOUT_MS)
    })
    expect(values[values.length - 1]).toEqual({ width: 120, settled: true })

    await React.act(async () => {
      root.render(<Probe paused onValue={onValue} />)
    })
    expect(values[values.length - 1]).toEqual({ width: 120, settled: false })
    expect(TrackingResizeObserver.instances[TrackingResizeObserver.instances.length - 1]?.observed.size ?? 0).toBe(
      0
    )
  })

  it('observes a target that appears on a later commit', async () => {
    function LateTarget({ show }: { show: boolean }) {
      const target = React.useRef<HTMLDivElement | null>(null)
      useMeasure<HTMLDivElement>({ target })
      if (!show) return <div data-empty="" />
      return (
        <div
          ref={el => {
            target.current = el
            if (el) el.getBoundingClientRect = () => new DOMRect(1, 2, 80, 24)
          }}
          data-target=""
        />
      )
    }

    await React.act(async () => {
      root.render(<LateTarget show={false} />)
    })
    expect(TrackingResizeObserver.instances[0]?.observed.size ?? 0).toBe(0)

    await React.act(async () => {
      root.render(<LateTarget show />)
    })
    expect(container.firstElementChild?.getAttribute('data-target')).toBe('')
    expect(
      TrackingResizeObserver.instances[TrackingResizeObserver.instances.length - 1]?.observed.has(
        container.firstElementChild!
      )
    ).toBe(true)
  })

  it('observes target.current when no callback ref has attached', async () => {
    function TargetProbe() {
      const target = React.useRef<HTMLDivElement | null>(null)
      useMeasure<HTMLDivElement>({ target })
      return (
        <div
          ref={el => {
            target.current = el
            if (el) el.getBoundingClientRect = () => new DOMRect(1, 2, 80, 24)
          }}
          data-target=""
        />
      )
    }

    await React.act(async () => {
      root.render(<TargetProbe />)
    })
    expect(container.childElementCount).toBe(1)
    expect(container.firstElementChild?.getAttribute('data-target')).toBe('')
    expect(TrackingResizeObserver.instances[0]?.observed.has(container.firstElementChild!)).toBe(
      true
    )
  })

  it('does not publish a new rect identity for sub-epsilon jitter', async () => {
    let width = 120
    const identities: Array<{ width: number }> = []
    function Identity() {
      const measure = useMeasure<HTMLDivElement>()
      React.useLayoutEffect(() => {
        if (measure.rect) identities.push(measure.rect)
      }, [measure.rect])
      return (
        <div
          ref={el => {
            if (el) el.getBoundingClientRect = () => new DOMRect(0, 0, width, 40)
            measure.ref(el)
          }}
        />
      )
    }

    await React.act(async () => {
      root.render(<Identity />)
    })
    await React.act(async () => {
      vi.advanceTimersByTime(MEASUREMENT_SETTLE_TIMEOUT_MS)
    })
    expect(identities).toHaveLength(1)

    width = 120.04
    await React.act(async () => {
      TrackingResizeObserver.instances[0]?.fire()
    })
    expect(identities).toHaveLength(1)

    width = 200
    await React.act(async () => {
      TrackingResizeObserver.instances[0]?.fire()
    })
    expect(identities).toHaveLength(2)
    expect(identities[0]).not.toBe(identities[1])
    expect(identities[1]?.width).toBe(200)
  })

  it('constructs ResizeObserver from the element ownerDocument', async () => {
    class ForeignResizeObserver extends TrackingResizeObserver {}
    function ForeignDoc() {
      const measure = useMeasure<HTMLDivElement>()
      return (
        <div
          ref={el => {
            if (el) {
              Object.defineProperty(el, 'ownerDocument', {
                configurable: true,
                value: { defaultView: { ResizeObserver: ForeignResizeObserver } },
              })
              el.getBoundingClientRect = () => new DOMRect(0, 0, 50, 20)
            }
            measure.ref(el)
          }}
        />
      )
    }

    await React.act(async () => {
      root.render(<ForeignDoc />)
    })
    const observer = TrackingResizeObserver.instances[TrackingResizeObserver.instances.length - 1]
    expect(observer).toBeInstanceOf(ForeignResizeObserver)
    expect(observer?.observed.size).toBe(1)
  })

  it('runs one observer and one settle under StrictMode', async () => {
    const values: Array<{ width: number | null; settled: boolean }> = []
    await React.act(async () => {
      root.render(
        <React.StrictMode>
          <Probe
            onValue={value => {
              values.push({ width: value.width, settled: value.settled })
            }}
          />
        </React.StrictMode>
      )
    })
    const live = TrackingResizeObserver.instances.filter(observer => observer.observed.size > 0)
    expect(live).toHaveLength(1)
    expect(live[0]?.observed.size).toBe(1)

    await React.act(async () => {
      vi.advanceTimersByTime(MEASUREMENT_SETTLE_TIMEOUT_MS)
    })
    expect(values[values.length - 1]).toEqual({ width: 120, settled: true })
    const settledTrue = values.filter(value => value.settled)
    expect(settledTrue.length).toBeGreaterThanOrEqual(1)
    expect(values.filter(value => value.settled).every(value => value.width === 120)).toBe(true)
  })
})
