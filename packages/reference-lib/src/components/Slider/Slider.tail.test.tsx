// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { Slider, type SliderValue } from './index'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// FINISH-LINE P2C tail: the 24 colocated pins for the IDs left open in
// SPEC.md (matrix re-target — no slider spec exists under matrix/ on this
// branch, so the tails land here per PATCHES/FEATURES crew precedent).
// SD-POINTER-14 is proven by the retitled real-engine CT leg instead:
// __e2e__/Slider.ct.spec.ts covers focusVisible modality honestly and
// happy-dom cannot drive isFocusVisible through real Tab modality.

function trackRect(rect: { left: number; right: number; top: number; bottom: number }) {
  const { left, right, top, bottom } = rect
  return {
    x: left,
    y: top,
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
    toJSON() {},
  } as DOMRect
}

function mockRects(rect = trackRect({ left: 0, right: 100, top: 0, bottom: 10 })) {
  return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect)
}

function pointerEvent(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: Partial<PointerEventInit> & { clientX?: number; clientY?: number } = {}
) {
  return new window.PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
    pointerId: 1,
    isPrimary: true,
    clientX: 0,
    clientY: 0,
    ...init,
  })
}

function keyEvent(type: 'keydown' | 'keyup', init: Partial<KeyboardEventInit> & { key: string }) {
  return new window.KeyboardEvent(type, { bubbles: true, cancelable: true, ...init })
}

class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch() {}
  render() {
    if (this.state.error) {
      return <div data-testid="boundary-error">{String(this.state.error.message)}</div>
    }
    return this.props.children
  }
}

function quietConsole() {
  return vi.spyOn(console, 'error').mockImplementation(() => {})
}

describe('Slider finish-line tail', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  async function renderUi(ui: React.ReactElement) {
    await React.act(async () => {
      root.render(ui)
    })
  }

  function thumb(id = 'thumb'): HTMLElement {
    return container.querySelector(`#${id}`) as HTMLElement
  }

  function track(id = 'track'): HTMLElement {
    return container.querySelector(`#${id}`) as HTMLElement
  }

  function rangeEl(): HTMLElement {
    return container.querySelector('[data-reference-slider-range]') as HTMLElement
  }

  function sliderRoot(): HTMLElement {
    return container.querySelector('[data-reference-slider]') as HTMLElement
  }

  function thumbVar(el: HTMLElement): string {
    return el.style.getPropertyValue('--reference-slider-thumb-position')
  }

  async function pressKey(el: HTMLElement, key: string, init: Partial<KeyboardEventInit> = {}) {
    React.act(() => {
      el.dispatchEvent(keyEvent('keydown', { key, ...init }))
    })
    React.act(() => {
      el.dispatchEvent(keyEvent('keyup', { key, ...init }))
    })
  }

  // Track press at clientX, optional drag moves, then release. Returns after
  // the session fully ends (release dispatched).
  async function trackPress(x: number, moves: number[] = []) {
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: x, clientY: 5 }))
    })
    for (const mx of moves) {
      React.act(() => {
        window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: mx, clientY: 5 }))
      })
    }
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: moves[moves.length - 1] ?? x, clientY: 5 }))
    })
  }

  async function thumbDrag(id: string, fromX: number, moves: number[]) {
    React.act(() => {
      thumb(id).dispatchEvent(pointerEvent('pointerdown', { clientX: fromX, clientY: 5 }))
    })
    for (const mx of moves) {
      React.act(() => {
        window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: mx, clientY: 5 }))
      })
    }
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: moves[moves.length - 1] ?? fromX, clientY: 5 }))
    })
  }

  it('SD-DOM-01: renders only documented non-form parts inside a form; submit/reset stay inert', async () => {
    mockRects()
    const log: unknown[] = []
    await renderUi(
      <form name="slider-form" data-testid="form">
        <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)} />
      </form>
    )
    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const rootEl = sliderRoot()
    expect(rootEl.tagName).toBe('DIV')
    // Default children carry no ids: locate the track by its part marker.
    const trackEl = container.querySelector('[data-reference-slider-track]') as HTMLElement
    expect(trackEl.tagName).toBe('DIV')
    expect(rangeEl().tagName).toBe('DIV')
    const thumbs = container.querySelectorAll('div[role="slider"]')
    expect(thumbs.length).toBe(1)
    expect(form.querySelector('input')).toBeNull()
    expect(form.querySelectorAll('[role="slider"]').length).toBe(1)

    // Submit: no Slider value in FormData, controlled value untouched, silent.
    React.act(() => {
      form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    })
    expect([...new FormData(form).entries()]).toEqual([])
    expect(container.querySelector('[role="slider"]')!.getAttribute('aria-valuenow')).toBe('20')
    expect(log).toEqual([])

    // Reset: same inertness (form wiring is application-owned).
    React.act(() => {
      form.reset()
    })
    expect([...new FormData(form).entries()]).toEqual([])
    expect(container.querySelector('[role="slider"]')!.getAttribute('aria-valuenow')).toBe('20')
    expect(log).toEqual([])
  })

  it('SD-DOM-02: publishes global and neighbor ARIA bounds across thumbs', async () => {
    mockRects()
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={() => {}}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb-0" aria-label="Min" />
            <Slider.Thumb id="thumb-1" aria-label="Max" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl([20, 70])
    expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('20')
    expect(thumb('thumb-0').getAttribute('aria-valuemin')).toBe('0')
    expect(thumb('thumb-0').getAttribute('aria-valuemax')).toBe('70')
    expect(thumb('thumb-1').getAttribute('aria-valuenow')).toBe('70')
    expect(thumb('thumb-1').getAttribute('aria-valuemin')).toBe('20')
    expect(thumb('thumb-1').getAttribute('aria-valuemax')).toBe('100')

    // Zero neighbor stays the real minimum (no falsy fallback to global min).
    await renderCtl([0, 70])
    expect(thumb('thumb-1').getAttribute('aria-valuemin')).toBe('0')
    expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('0')
  })

  it('SD-DOM-03: preserves consumer DOM props across a drag and a disabled toggle', async () => {
    mockRects()
    const log: unknown[] = []
    const trackPointerLog: string[] = []
    const rootRef = React.createRef<HTMLDivElement>()
    const trackRef = React.createRef<HTMLDivElement>()
    const rangeRef = React.createRef<HTMLDivElement>()
    const thumbRef = React.createRef<HTMLDivElement>()
    const consumerTransform = 'rotate(5deg)'
    const renderCtl = (disabled: boolean) =>
      renderUi(
        <Slider
          value={20}
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          onChange={next => void log.push(next)}
          ref={rootRef}
          data-owner="root"
          className="consumer-root"
        >
          <Slider.Track
            id="track"
            ref={trackRef}
            data-owner="track"
            className="consumer-track"
            style={{ color: 'rgb(1, 2, 3)' }}
            onPointerDown={() => void trackPointerLog.push('track-pointerdown')}
          >
            <Slider.Range data-owner-range="range" className="consumer-range" ref={rangeRef} />
            <Slider.Thumb
              id="thumb"
              aria-label="T"
              data-owner="thumb"
              className="consumer-thumb"
              style={{ transform: consumerTransform, color: 'rgb(4, 5, 6)' }}
              ref={thumbRef}
            />
          </Slider.Track>
        </Slider>
      )
    await renderCtl(false)

    // Drag: authoritative hooks move while consumer props survive.
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 60, clientY: 5 }))
    })
    expect(sliderRoot().hasAttribute('data-dragging')).toBe(true)
    expect(thumb().hasAttribute('data-dragging')).toBe(true)
    expect(trackPointerLog).toEqual(['track-pointerdown'])
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 60, clientY: 5 }))
    })
    expect(sliderRoot().hasAttribute('data-dragging')).toBe(false)
    expect(log).toEqual([60])

    // Toggle disabled: hooks update on documented parts, nothing else moves.
    await renderCtl(true)
    expect(sliderRoot().hasAttribute('data-disabled')).toBe(true)
    expect(thumb().getAttribute('aria-disabled')).toBe('true')
    expect(thumb().hasAttribute('data-disabled')).toBe(true)
    expect(sliderRoot().getAttribute('data-orientation')).toBe('horizontal')
    expect(track().getAttribute('data-orientation')).toBe('horizontal')

    // Every consumer prop, style, and ref survives both transitions.
    expect(sliderRoot().getAttribute('data-owner')).toBe('root')
    expect(sliderRoot().className).toContain('consumer-root')
    expect(track().getAttribute('data-owner')).toBe('track')
    expect(track().className).toContain('consumer-track')
    expect(track().style.color).toBe('rgb(1, 2, 3)')
    expect(rangeEl().getAttribute('data-owner-range')).toBe('range')
    expect(rangeEl().className).toContain('consumer-range')
    expect(thumb().getAttribute('data-owner')).toBe('thumb')
    expect(thumb().className).toContain('consumer-thumb')
    expect(thumb().style.transform).toBe(consumerTransform)
    expect(thumb().style.color).toBe('rgb(4, 5, 6)')
    expect(rootRef.current).toBe(sliderRoot())
    expect(trackRef.current).toBe(track())
    expect(rangeRef.current).toBe(rangeEl())
    expect(thumbRef.current).toBe(thumb())
  })

  it('SD-DOM-04: preserves application-provided accessible names and value text', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <div>
          <span id="maximum-label">Maximum price</span>
          <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb-0" aria-label="Minimum price" aria-valuetext="$20" />
              <Slider.Thumb id="thumb-1" aria-labelledby="maximum-label" aria-valuetext="$70" />
            </Slider.Track>
          </Slider>
        </div>
      )
    await renderCtl([20, 70])
    const assertNames = () => {
      expect(thumb('thumb-0').getAttribute('aria-label')).toBe('Minimum price')
      expect(thumb('thumb-0').getAttribute('aria-valuetext')).toBe('$20')
      expect(thumb('thumb-1').getAttribute('aria-labelledby')).toBe('maximum-label')
      expect(thumb('thumb-1').getAttribute('aria-valuetext')).toBe('$70')
    }
    assertNames()

    // Change values; exact attributes stay on the matching sliders.
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'ArrowRight')
    expect(log).toEqual([[21, 70]])
    await renderCtl([21, 70])
    assertNames()
  })

  it('SD-DOM-07: stays value-stable while the whole control is disabled', async () => {
    mockRects()
    const log: unknown[] = []
    await renderUi(
      <Slider value={[20, 80]} min={0} max={100} step={1} disabled onChange={next => void log.push(next)}>
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb-0" aria-label="Min" />
          <Slider.Thumb id="thumb-1" aria-label="Max" />
        </Slider.Track>
      </Slider>
    )
    expect(thumb('thumb-0').getAttribute('aria-disabled')).toBe('true')
    expect(thumb('thumb-1').getAttribute('aria-disabled')).toBe('true')
    expect(thumb('thumb-0').hasAttribute('data-disabled')).toBe(true)
    expect(sliderRoot().hasAttribute('data-disabled')).toBe(true)

    // Focus, handled keys, track press, and thumb drag: all inert.
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'ArrowRight')
    await pressKey(thumb('thumb-1'), 'End')
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 60, clientY: 5 }))
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 70 }))
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 70 }))
    })
    React.act(() => {
      thumb('thumb-0').dispatchEvent(pointerEvent('pointerdown', { clientX: 20, clientY: 5 }))
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 40 }))
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 40 }))
    })
    expect(log).toEqual([])
    expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('20')
    expect(thumb('thumb-1').getAttribute('aria-valuenow')).toBe('80')
    expect(thumbVar(thumb('thumb-0'))).toBe('20%')
    expect(thumbVar(thumb('thumb-1'))).toBe('80%')
    expect(sliderRoot().hasAttribute('data-dragging')).toBe(false)
  })

  it('SD-DOM-09: updates frozen percentage hooks without touching consumer geometry', async () => {
    mockRects()
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={10} max={110} step={1} onChange={() => {}}>
          <Slider.Track id="track">
            <Slider.Range id="range" style={{ ['--custom' as any]: 'keep-me' }} />
            {Array.isArray(v) ? (
              <>
                <Slider.Thumb
                  id="thumb-0"
                  aria-label="Min"
                  style={{ position: 'relative', transform: 'scale(1.1)' }}
                />
                <Slider.Thumb id="thumb-1" aria-label="Max" />
              </>
            ) : (
              <Slider.Thumb
                id="thumb"
                aria-label="T"
                style={{ position: 'relative', transform: 'scale(1.1)' }}
              />
            )}
          </Slider.Track>
        </Slider>
      )
    await renderCtl(60)
    expect(thumbVar(thumb())).toBe('50%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-start')).toBe('0%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-end')).toBe('50%')

    await renderCtl([30, 90])
    expect(thumbVar(thumb('thumb-0'))).toBe('20%')
    expect(thumbVar(thumb('thumb-1'))).toBe('80%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-start')).toBe('20%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-end')).toBe('80%')

    // One rerender moves every hook together; consumer geometry is untouched.
    await renderCtl([50, 100])
    expect(thumbVar(thumb('thumb-0'))).toBe('40%')
    expect(thumbVar(thumb('thumb-1'))).toBe('90%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-start')).toBe('40%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-end')).toBe('90%')
    expect(thumb('thumb-0').style.position).toBe('relative')
    expect(thumb('thumb-0').style.transform).toBe('scale(1.1)')
    expect(rangeEl().style.getPropertyValue('--custom')).toBe('keep-me')
  })

  it('SD-DOM-10: synchronizes thumb orientation ARIA when root orientation changes', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (orientation: 'horizontal' | 'vertical') =>
      renderUi(
        <Slider
          value={[25, 75]}
          min={0}
          max={100}
          step={1}
          orientation={orientation}
          onChange={next => void log.push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb-0" aria-label="Min" />
            <Slider.Thumb id="thumb-1" aria-label="Max" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl('horizontal')
    expect(thumb('thumb-0').getAttribute('aria-orientation')).toBe('horizontal')
    expect(thumb('thumb-1').getAttribute('aria-orientation')).toBe('horizontal')

    await renderCtl('vertical')
    expect(thumb('thumb-0').getAttribute('aria-orientation')).toBe('vertical')
    expect(thumb('thumb-1').getAttribute('aria-orientation')).toBe('vertical')
    expect(sliderRoot().getAttribute('data-orientation')).toBe('vertical')
    expect(track().getAttribute('data-orientation')).toBe('vertical')
    // Values and labels stay paired; the axis flip itself requests nothing.
    expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('25')
    expect(thumb('thumb-1').getAttribute('aria-valuenow')).toBe('75')
    expect(thumb('thumb-0').getAttribute('aria-label')).toBe('Min')
    expect(thumb('thumb-1').getAttribute('aria-label')).toBe('Max')
    expect(log).toEqual([])
  })

  it('SD-DOM-11: applies deterministic enabled horizontal defaults for omitted props', async () => {
    mockRects()
    for (const omitted of [true, false]) {
      const log: unknown[] = []
      await renderUi(
        omitted ? (
          <Slider value={50} onChange={next => void log.push(next)}>
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
        ) : (
          <Slider
            value={50}
            min={undefined}
            max={undefined}
            step={undefined}
            orientation={undefined}
            disabled={undefined}
            onChange={next => void log.push(next)}
          >
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
        )
      )
      expect(thumb().getAttribute('aria-valuemin')).toBe('0')
      expect(thumb().getAttribute('aria-valuemax')).toBe('100')
      expect(thumb().getAttribute('aria-valuenow')).toBe('50')
      expect(thumb().getAttribute('aria-orientation')).toBe('horizontal')
      expect(sliderRoot().getAttribute('data-orientation')).toBe('horizontal')
      expect(thumb().hasAttribute('data-disabled')).toBe(false)
      expect(thumb().getAttribute('tabindex')).toBe('0')
      thumb().focus()
      await pressKey(thumb(), 'ArrowRight')
      expect(log).toEqual([51])
    }
  })

  it('SD-CTRL-01: preserves the public value shape across key, press, and drag', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            {Array.isArray(v) ? (
              <>
                <Slider.Thumb id="thumb-0" aria-label="Min" />
                <Slider.Thumb id="thumb-1" aria-label="Max" />
              </>
            ) : (
              <Slider.Thumb id="thumb" aria-label="T" />
            )}
          </Slider.Track>
        </Slider>
      )

    // Scalar: every modality requests a bare number.
    await renderCtl(20)
    thumb().focus()
    await pressKey(thumb(), 'ArrowRight')
    await trackPress(60)
    await thumbDrag('thumb', 20, [80])
    expect(log).toEqual([21, 60, 80])
    for (const entry of log) expect(typeof entry).toBe('number')

    // Range: every modality requests the complete ordered array.
    log.length = 0
    await renderCtl([20, 80])
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'ArrowRight')
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 90, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 90, clientY: 5 }))
    })
    await thumbDrag('thumb-1', 80, [70])
    expect(log).toEqual([
      [21, 80],
      [20, 90],
      [20, 70],
    ])
    for (const entry of log) {
      expect(Array.isArray(entry)).toBe(true)
      expect((entry as number[]).length).toBe(2)
    }
  })

  it('SD-CTRL-02: retains rendered controlled state when the parent rejects requests', async () => {
    mockRects()
    const log: unknown[] = []
    await renderUi(
      <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)}>
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb" aria-label="T" />
        </Slider.Track>
      </Slider>
    )
    // Press at 60, drag toward 80 — never rerendering (parent rejects all).
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 60, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 80, clientY: 5 }))
    })
    expect(log).toEqual([60, 80])
    expect(thumb().getAttribute('aria-valuenow')).toBe('20')
    expect(thumbVar(thumb())).toBe('20%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-end')).toBe('20%')

    // Release commits no optimistic value into rendered state.
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 80, clientY: 5 }))
    })
    expect(thumb().getAttribute('aria-valuenow')).toBe('20')
    expect(thumbVar(thumb())).toBe('20%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-end')).toBe('20%')
  })

  it('SD-CTRL-03: updates geometry without synthetic events on programmatic change', async () => {
    mockRects()
    const log: unknown[] = []
    const pointerLog: string[] = []
    const keyLog: string[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb
              id="thumb-0"
              aria-label="Min"
              onPointerDown={() => void pointerLog.push('down')}
              onPointerMove={() => void pointerLog.push('move')}
              onPointerUp={() => void pointerLog.push('up')}
              onKeyDown={() => void keyLog.push('down')}
              onKeyUp={() => void keyLog.push('up')}
            />
            <Slider.Thumb id="thumb-1" aria-label="Max" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl([20, 50])
    const first = thumb('thumb-0')
    const second = thumb('thumb-1')
    first.focus()
    expect(document.activeElement).toBe(first)

    await renderCtl([33, 72])
    // Same nodes, new geometry, focus unmoved, every handler silent.
    expect(thumb('thumb-0')).toBe(first)
    expect(thumb('thumb-1')).toBe(second)
    expect(first.getAttribute('aria-valuenow')).toBe('33')
    expect(second.getAttribute('aria-valuenow')).toBe('72')
    expect(thumbVar(first)).toBe('33%')
    expect(thumbVar(second)).toBe('72%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-start')).toBe('33%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-end')).toBe('72%')
    expect(document.activeElement).toBe(first)
    expect(log).toEqual([])
    expect(pointerLog).toEqual([])
    expect(keyLog).toEqual([])
  })

  it('SD-CTRL-04: emits no request when clamping or snapping leaves the value unchanged', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            {Array.isArray(v) ? (
              <>
                <Slider.Thumb id="thumb-0" aria-label="Min" />
                <Slider.Thumb id="thumb-1" aria-label="Max" />
              </>
            ) : (
              <Slider.Thumb id="thumb" aria-label="T" />
            )}
          </Slider.Track>
        </Slider>
      )

    await renderCtl(100)
    thumb().focus()
    await pressKey(thumb(), 'ArrowRight')
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 100, clientY: 5 }))
    })
    expect(log).toEqual([])
    expect(thumb().getAttribute('aria-valuenow')).toBe('100')
    expect(thumbVar(thumb())).toBe('100%')
    expect(document.activeElement).toBe(thumb())
    expect(thumb().hasAttribute('data-active')).toBe(false)
    expect(thumb().hasAttribute('data-dragging')).toBe(false)

    // Overlapping [50,50]: the first thumb cannot move right (neighbor wall).
    await renderCtl([50, 50])
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'ArrowRight')
    await thumbDrag('thumb-0', 50, [70])
    expect(log).toEqual([])
    expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('50')
    expect(thumbVar(thumb('thumb-0'))).toBe('50%')
    expect(document.activeElement).toBe(thumb('thumb-0'))
  })

  it('SD-CTRL-06: lets consumer preventDefault cancel matching internal changes', async () => {
    mockRects()
    const log: unknown[] = []
    const consumerLog: string[] = []
    const captureSpy = vi.fn()
    await renderUi(
      <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)}>
        <Slider.Track
          id="track"
          onPointerDown={e => {
            consumerLog.push('track-pointerdown')
            e.preventDefault()
          }}
        >
          <Slider.Range />
          <Slider.Thumb
            id="thumb"
            aria-label="T"
            onPointerDown={e => {
              consumerLog.push('thumb-pointerdown')
              e.preventDefault()
            }}
            onKeyDown={e => {
              consumerLog.push('thumb-keydown')
              e.preventDefault()
            }}
          />
        </Slider.Track>
      </Slider>
    )
    // Capture would run on the track node; spy there to prove it never starts.
    ;(track() as any).setPointerCapture = captureSpy

    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 70, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 80 }))
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 80 }))
    })
    React.act(() => {
      thumb().dispatchEvent(pointerEvent('pointerdown', { clientX: 20, clientY: 5 }))
    })
    thumb().focus()
    await pressKey(thumb(), 'ArrowRight')

    // Consumer ran first every time; nothing internal started. (The prevented
    // thumb press bubbles to the track consumer — internal code returns
    // before stopPropagation — so the track consumer logs twice.)
    expect(consumerLog).toEqual([
      'track-pointerdown',
      'thumb-pointerdown',
      'track-pointerdown',
      'thumb-keydown',
    ])
    expect(captureSpy).not.toHaveBeenCalled()
    expect(log).toEqual([])
    expect(sliderRoot().hasAttribute('data-dragging')).toBe(false)
    expect(thumb().getAttribute('aria-valuenow')).toBe('20')
    expect(thumbVar(thumb())).toBe('20%')
  })

  it('SD-CTRL-08: publishes from accepted values across a distance-clamped rejection', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider
          value={v}
          min={0}
          max={100}
          step={10}
          minStepsBetweenThumbs={3}
          onChange={next => void log.push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb-0" aria-label="Min" />
            <Slider.Thumb id="thumb-1" aria-label="Max" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl([20, 80])

    // Lower thumb dragged toward 70: exactly one clamped request for [50,80].
    React.act(() => {
      thumb('thumb-0').dispatchEvent(pointerEvent('pointerdown', { clientX: 20, clientY: 5 }))
    })
    expect(log).toEqual([])
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 70, clientY: 5 }))
    })
    expect(log).toEqual([[50, 80]])
    // Rendered state still reflects the accepted [20,80] — no optimistic leak.
    expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('20')
    expect(thumbVar(thumb('thumb-0'))).toBe('20%')
    expect(thumbVar(thumb('thumb-1'))).toBe('80%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-start')).toBe('20%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-end')).toBe('80%')
    expect(thumb('thumb-0').getAttribute('aria-valuemax')).toBe('50')
    expect(thumb('thumb-1').getAttribute('aria-valuemin')).toBe('50')
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 70, clientY: 5 }))
    })

    // Parent accepts: the same nodes publish the new geometry, nothing extra.
    await renderCtl([50, 80])
    expect(thumbVar(thumb('thumb-0'))).toBe('50%')
    expect(thumbVar(thumb('thumb-1'))).toBe('80%')
    expect(thumb('thumb-0').getAttribute('aria-valuemax')).toBe('50')
    expect(thumb('thumb-1').getAttribute('aria-valuemin')).toBe('80')
    expect(log).toEqual([[50, 80]])
  })

  it('SD-KEY-01: maps horizontal LTR arrows to one normal step', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={2} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb" aria-label="T" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl(20)
    thumb().focus()
    for (const [key, expected] of [
      ['ArrowRight', 22],
      ['ArrowUp', 22],
      ['ArrowLeft', 18],
      ['ArrowDown', 18],
    ] as const) {
      const before = log.length
      await pressKey(thumb(), key)
      expect(log.length).toBe(before + 1)
      expect(log[before]).toBe(expected)
      expect(document.activeElement).toBe(thumb())
      // Fresh accepted run for the next key.
      await renderCtl(20)
      thumb().focus()
    }
  })

  it('SD-KEY-05: sends Home and End to feasible neighbor bounds in a range', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb-0" aria-label="Min" />
            <Slider.Thumb id="thumb-1" aria-label="Max" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl([20, 70])

    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'Home')
    expect(log).toEqual([[0, 70]])
    await renderCtl([20, 70])
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'End')
    expect(log).toEqual([
      [0, 70],
      [70, 70],
    ])

    await renderCtl([20, 70])
    thumb('thumb-1').focus()
    await pressKey(thumb('thumb-1'), 'Home')
    await renderCtl([20, 70])
    thumb('thumb-1').focus()
    await pressKey(thumb('thumb-1'), 'End')
    expect(log).toEqual([
      [0, 70],
      [70, 70],
      [20, 20],
      [20, 100],
    ])
  })

  it('SD-KEY-06: changes only the focused logical thumb on a range key', async () => {
    mockRects()
    const log: unknown[] = []
    const refs = [React.createRef<HTMLDivElement>(), React.createRef<HTMLDivElement>(), React.createRef<HTMLDivElement>()]
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb-0" aria-label="Low" ref={refs[0]} />
            <Slider.Thumb id="thumb-1" aria-label="Mid" ref={refs[1]} />
            <Slider.Thumb id="thumb-2" aria-label="High" ref={refs[2]} />
          </Slider.Track>
        </Slider>
      )
    await renderCtl([10, 40, 80])
    const nodes = [thumb('thumb-0'), thumb('thumb-1'), thumb('thumb-2')]
    thumb('thumb-1').focus()
    await pressKey(thumb('thumb-1'), 'ArrowRight')
    expect(log).toEqual([[10, 41, 80]])

    await renderCtl([10, 41, 80])
    // Same three nodes; only index 1 moved.
    expect(thumb('thumb-0')).toBe(nodes[0])
    expect(thumb('thumb-1')).toBe(nodes[1])
    expect(thumb('thumb-2')).toBe(nodes[2])
    expect(refs[1].current).toBe(nodes[1])
    expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('10')
    expect(thumb('thumb-1').getAttribute('aria-valuenow')).toBe('41')
    expect(thumb('thumb-2').getAttribute('aria-valuenow')).toBe('80')
    expect(thumbVar(thumb('thumb-0'))).toBe('10%')
    expect(thumbVar(thumb('thumb-1'))).toBe('41%')
    expect(thumbVar(thumb('thumb-2'))).toBe('80%')
    expect(thumb('thumb-0').getAttribute('aria-label')).toBe('Low')
    expect(thumb('thumb-1').getAttribute('aria-label')).toBe('Mid')
    expect(thumb('thumb-2').getAttribute('aria-label')).toBe('High')
    expect(document.activeElement).toBe(nodes[1])
  })

  it('SD-KEY-08: keeps focus without duplicate requests when a handled key hits a bound', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb" aria-label="T" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl(0)
    thumb().focus()
    // Bound keys are handled (preventDefault) but request nothing.
    for (const key of ['ArrowLeft', 'PageDown']) {
      let canceled: boolean | undefined
      React.act(() => {
        canceled = !thumb().dispatchEvent(keyEvent('keydown', { key }))
      })
      expect(canceled).toBe(true)
    }
    expect(log).toEqual([])
    expect(document.activeElement).toBe(thumb())
    expect(thumb().getAttribute('aria-valuenow')).toBe('0')
    expect(thumbVar(thumb())).toBe('0%')

    await renderCtl(100)
    thumb().focus()
    for (const key of ['ArrowRight', 'PageUp', 'End']) {
      let canceled: boolean | undefined
      React.act(() => {
        canceled = !thumb().dispatchEvent(keyEvent('keydown', { key }))
      })
      expect(canceled).toBe(true)
    }
    expect(log).toEqual([])
    expect(document.activeElement).toBe(thumb())
    expect(thumb().getAttribute('aria-valuenow')).toBe('100')
    expect(thumbVar(thumb())).toBe('100%')
  })

  it('SD-KEY-09: clamps keyboard movement at the minimum-distance boundary', async () => {
    mockRects()
    const log: unknown[] = []
    const ref0 = React.createRef<HTMLDivElement>()
    const ref1 = React.createRef<HTMLDivElement>()
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider
          value={v}
          min={0}
          max={100}
          step={10}
          minStepsBetweenThumbs={3}
          onChange={next => void log.push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb-0" aria-label="Min" ref={ref0} />
            <Slider.Thumb id="thumb-1" aria-label="Max" ref={ref1} />
          </Slider.Track>
        </Slider>
      )
    // Lower thumb: 20 -> 30 accepted, then the wall (30-unit distance).
    await renderCtl([20, 60])
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'ArrowRight')
    expect(log).toEqual([[30, 60]])
    await renderCtl([30, 60])
    const lowerNode = thumb('thumb-0')
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'ArrowRight')
    expect(log).toEqual([[30, 60]])
    expect(document.activeElement).toBe(lowerNode)
    expect(lowerNode.getAttribute('aria-label')).toBe('Min')
    expect(ref0.current).toBe(lowerNode)

    // Upper thumb, fresh run: 60 -> 50 accepted, then the wall.
    await renderCtl([20, 60])
    thumb('thumb-1').focus()
    await pressKey(thumb('thumb-1'), 'ArrowLeft')
    expect(log).toEqual([
      [30, 60],
      [20, 50],
    ])
    await renderCtl([20, 50])
    const upperNode = thumb('thumb-1')
    thumb('thumb-1').focus()
    await pressKey(thumb('thumb-1'), 'ArrowLeft')
    expect(log).toEqual([
      [30, 60],
      [20, 50],
    ])
    expect(document.activeElement).toBe(upperNode)
    expect(upperNode.getAttribute('aria-label')).toBe('Max')
    expect(ref1.current).toBe(upperNode)
    // DOM order never moves.
    expect(thumb('thumb-0').compareDocumentPosition(thumb('thumb-1')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('SD-POINTER-11: clamps without swapping logical identity at a neighbor', async () => {
    mockRects()
    const log: unknown[] = []
    const ref1 = React.createRef<HTMLDivElement>()
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb-0" aria-label="Min" />
            <Slider.Thumb id="thumb-1" aria-label="Max" ref={ref1} />
          </Slider.Track>
        </Slider>
      )
    await renderCtl([40, 80])
    const draggedNode = thumb('thumb-1')

    // Drag index 1 past index 0 toward min: stops at equality.
    React.act(() => {
      draggedNode.dispatchEvent(pointerEvent('pointerdown', { clientX: 80, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 0, clientY: 5 }))
    })
    expect(log).toEqual([[40, 40]])
    // Mid-drag active styling belongs to the dragged thumb only.
    expect(draggedNode.hasAttribute('data-active')).toBe(true)
    expect(draggedNode.hasAttribute('data-dragging')).toBe(true)
    expect(thumb('thumb-0').hasAttribute('data-active')).toBe(false)
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 0, clientY: 5 }))
    })

    await renderCtl([40, 40])
    expect(thumb('thumb-1')).toBe(draggedNode)
    expect(ref1.current).toBe(draggedNode)
    expect(document.activeElement).toBe(draggedNode)
    expect(draggedNode.getAttribute('aria-label')).toBe('Max')
    expect(draggedNode.getAttribute('aria-valuenow')).toBe('40')
    // DOM order preserved; the most-recently-active thumb paints on top.
    expect(thumb('thumb-0').compareDocumentPosition(draggedNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(draggedNode.style.zIndex).toBe('2')
    expect(thumb('thumb-0').style.zIndex).toBe('1')
  })

  it('SD-POINTER-12: clamps pointer movement from either thumb under a positive minimum distance', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider
          value={v}
          min={0}
          max={100}
          step={10}
          minStepsBetweenThumbs={3}
          onChange={next => void log.push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb-0" aria-label="Min" />
            <Slider.Thumb id="thumb-1" aria-label="Max" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl([20, 80])
    await thumbDrag('thumb-0', 20, [90])
    expect(log).toEqual([[50, 80]])
    expect((log[0] as number[])[1]).toBe(80)

    // Fresh run from the other side.
    log.length = 0
    await renderCtl([20, 80])
    await thumbDrag('thumb-1', 80, [10])
    expect(log).toEqual([[20, 50]])
    expect((log[0] as number[])[0]).toBe(20)
  })

  it('SD-DYNAMIC-01: preserves surviving thumb identity across cardinality and order changes', async () => {
    mockRects()
    const log: unknown[] = []
    const refA = React.createRef<HTMLDivElement>()
    const refC = React.createRef<HTMLDivElement>()
    const renderCtl = (v: number[], order: Array<'a' | 'b' | 'c'>) =>
      renderUi(
        <Slider value={[...v]} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            {order.map(k =>
              k === 'a' ? (
                <Slider.Thumb key="a" id="thumb-a" aria-label="Alpha" ref={refA} />
              ) : k === 'b' ? (
                <Slider.Thumb key="b" id="thumb-b" aria-label="Beta" />
              ) : (
                <Slider.Thumb key="c" id="thumb-c" aria-label="Gamma" ref={refC} />
              )
            )}
          </Slider.Track>
        </Slider>
      )
    const byId = (id: string) => container.querySelector(`#${id}`) as HTMLElement

    await renderCtl([20, 50, 80], ['a', 'b', 'c'])
    const nodeA = byId('thumb-a')
    const nodeC = byId('thumb-c')
    byId('thumb-b').focus()

    // Shrink: surviving labels/refs/ARIA stay paired; no request fires.
    await renderCtl([20, 80], ['a', 'c'])
    expect(byId('thumb-a')).toBe(nodeA)
    expect(byId('thumb-c')).toBe(nodeC)
    expect(refA.current).toBe(nodeA)
    expect(refC.current).toBe(nodeC)
    expect(nodeA.getAttribute('aria-label')).toBe('Alpha')
    expect(nodeC.getAttribute('aria-label')).toBe('Gamma')
    expect(nodeA.getAttribute('aria-valuenow')).toBe('20')
    expect(nodeC.getAttribute('aria-valuenow')).toBe('80')
    expect(thumbVar(nodeA)).toBe('20%')
    expect(thumbVar(nodeC)).toBe('80%')
    expect(log).toEqual([])

    // Grow: the reinserted entry binds by position; survivors keep nodes.
    await renderCtl([20, 50, 80], ['a', 'b', 'c'])
    expect(byId('thumb-a')).toBe(nodeA)
    expect(byId('thumb-c')).toBe(nodeC)
    expect(byId('thumb-b').getAttribute('aria-valuenow')).toBe('50')
    expect(log).toEqual([])

    // Reorder paired with a value change: ranks rebind by DOM position on
    // that render (a pure key-reorder with an identical array would not —
    // see SPEC FEATURES notes). Arrays are positional, so Gamma moves to
    // rank 0 and publishes entries[0].
    await renderCtl([20, 80], ['c', 'a'])
    expect(byId('thumb-c')).toBe(nodeC)
    expect(byId('thumb-a')).toBe(nodeA)
    expect(nodeC.getAttribute('aria-label')).toBe('Gamma')
    expect(nodeC.getAttribute('aria-valuenow')).toBe('20')
    expect(nodeA.getAttribute('aria-valuenow')).toBe('80')
    expect(thumbVar(nodeC)).toBe('20%')
    expect(thumbVar(nodeA)).toBe('80%')
    expect(log).toEqual([])

    // The recalculated rank drives interaction: Gamma is now index 0.
    nodeC.focus()
    await pressKey(nodeC, 'ArrowRight')
    expect(log).toEqual([[21, 80]])
  })

  it('SD-DYNAMIC-04: recomputes minimum distance when step config changes dynamically', async () => {
    mockRects()
    const silence = quietConsole()
    try {
      const log: unknown[] = []
      const renderCtl = (step: number, minSteps: number, v: SliderValue) =>
        renderUi(
          <Boundary>
            <Slider
              value={v}
              min={0}
              max={100}
              step={step}
              minStepsBetweenThumbs={minSteps}
              onChange={next => void log.push(next)}
            >
              <Slider.Track id="track">
                <Slider.Range />
                <Slider.Thumb id="thumb-0" aria-label="Min" />
                <Slider.Thumb id="thumb-1" aria-label="Max" />
              </Slider.Track>
            </Slider>
          </Boundary>
        )
      const boundsPair = () =>
        [thumb('thumb-0').getAttribute('aria-valuemax'), thumb('thumb-1').getAttribute('aria-valuemin')] as const

      // Distance 10: 70/30.
      await renderCtl(5, 2, [20, 80])
      const node0 = thumb('thumb-0')
      const node1 = thumb('thumb-1')
      expect(boundsPair()).toEqual(['70', '30'])
      thumb('thumb-0').focus()
      await pressKey(thumb('thumb-0'), 'End')
      await thumbDrag('thumb-0', 20, [90])
      expect(log).toEqual([
        [70, 80],
        [70, 80],
      ])
      expect(document.activeElement).toBe(node0)

      // Distance 30: 50/50, same nodes, no focus/identity churn.
      await renderCtl(5, 6, [20, 80])
      expect(thumb('thumb-0')).toBe(node0)
      expect(thumb('thumb-1')).toBe(node1)
      expect(boundsPair()).toEqual(['50', '50'])
      thumb('thumb-0').focus()
      await pressKey(thumb('thumb-0'), 'End')
      await thumbDrag('thumb-0', 20, [90])
      expect(log).toEqual([
        [70, 80],
        [70, 80],
        [50, 80],
        [50, 80],
      ])

      // Distance 60 (the exact gap): 20/80; inward moves are focused no-ops.
      await renderCtl(10, 6, [20, 80])
      expect(thumb('thumb-0')).toBe(node0)
      expect(boundsPair()).toEqual(['20', '80'])
      const logLength = log.length
      thumb('thumb-0').focus()
      await pressKey(thumb('thumb-0'), 'End')
      await thumbDrag('thumb-0', 20, [90])
      thumb('thumb-1').focus()
      await pressKey(thumb('thumb-1'), 'Home')
      expect(log.length).toBe(logLength)
      expect(document.activeElement).toBe(node1)

      // Distance 70 exceeds the controlled gap: atomic rejection, nothing new.
      await renderCtl(10, 7, [20, 80])
      expect(container.querySelector('[data-testid="boundary-error"]')?.textContent).toMatch(
        /violates minimum required distance/
      )
      expect(log.length).toBe(logLength)
      expect(container.querySelectorAll('[role="slider"]').length).toBe(0)
    } finally {
      silence.mockRestore()
    }
  })

  it('SD-COMP-02: preserves thumb identities when an RTL range meets at one value', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <div dir="rtl">
          <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb-0" aria-label="Minimum" />
              <Slider.Thumb id="thumb-1" aria-label="Maximum" />
            </Slider.Track>
          </Slider>
        </div>
      )
    await renderCtl([20, 80])

    // RTL physical map: value v sits at x = 100 - v. Drag each toward other.
    await thumbDrag('thumb-0', 80, [70])
    expect(log).toEqual([[30, 80]])
    await renderCtl([30, 80])
    await thumbDrag('thumb-1', 20, [30])
    expect(log).toEqual([
      [30, 80],
      [30, 70],
    ])
    await renderCtl([30, 70])

    // Arrow the rest of the way (Page step 10): meet at [50,50].
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'PageUp')
    await renderCtl([40, 70])
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'PageUp')
    await renderCtl([50, 70])
    thumb('thumb-1').focus()
    await pressKey(thumb('thumb-1'), 'PageDown')
    await renderCtl([50, 60])
    thumb('thumb-1').focus()
    await pressKey(thumb('thumb-1'), 'PageDown')
    await renderCtl([50, 50])
    expect(log[log.length - 1]).toEqual([50, 50])

    // Cannot cross at equality: RTL inward keys are focused no-ops.
    const logLength = log.length
    thumb('thumb-0').focus()
    await pressKey(thumb('thumb-0'), 'ArrowLeft')
    thumb('thumb-1').focus()
    await pressKey(thumb('thumb-1'), 'ArrowRight')
    expect(log.length).toBe(logLength)

    // Both tabbable in DOM order; range geometry collapses to zero.
    expect(thumb('thumb-0').getAttribute('tabindex')).toBe('0')
    expect(thumb('thumb-1').getAttribute('tabindex')).toBe('0')
    expect(thumb('thumb-0').compareDocumentPosition(thumb('thumb-1')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-start')).toBe('50%')
    expect(rangeEl().style.getPropertyValue('--reference-slider-range-end')).toBe('50%')

    // Most-recently-active thumb wins the stacked tie press (value 50 → x=50).
    thumb('thumb-1').focus()
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 50, clientY: 5 }))
    })
    expect(document.activeElement).toBe(thumb('thumb-1'))
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 50, clientY: 5 }))
    })
    expect(log.length).toBe(logLength)
  })
})
