// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { Slider, type SliderValue } from './index'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

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

describe('Slider FEATURES pins', () => {
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

  function rootEl(id = 'slider'): HTMLElement {
    return container.querySelector(`#${id}`) as HTMLElement
  }

  it('FEATURES #1: value is required and uncontrolled props are gone', async () => {
    mockRects()
    const silence = quietConsole()
    try {
      // Missing value fails fast at render: no silent uncontrolled fallback.
      await renderUi(
        <Boundary>
          {/* @ts-expect-error - value is required */}
          <Slider min={0} max={100} step={1}>
            <Slider.Track>
              <Slider.Range />
              <Slider.Thumb aria-label="T" />
            </Slider.Track>
          </Slider>
        </Boundary>
      )
      expect(container.querySelector('[data-testid="boundary-error"]')?.textContent).toMatch(
        /'value' must be a number or array of numbers/
      )

      // A provided value renders and requests; nothing internal advances it.
      const log: unknown[] = []
      await renderUi(
        <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb id="thumb" aria-label="T" />
          </Slider.Track>
        </Slider>
      )
      React.act(() => {
        thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
      })
      expect(log).toEqual([21])
      // The rejecting parent holds: no internal state moved the thumb.
      expect(thumb().getAttribute('aria-valuenow')).toBe('20')
    } finally {
      silence.mockRestore()
    }
  })

  it('SD-DYNAMIC-01: thumbs bind mount-order positions with no index prop', async () => {
    mockRects()
    const log: unknown[] = []
    const renderRange = (v: number[], labels: string[]) =>
      renderUi(
        <Slider value={v} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            {labels.map(label => (
              <Slider.Thumb key={label} id={`thumb-${label}`} aria-label={label} />
            ))}
          </Slider.Track>
        </Slider>
      )
    await renderRange([20, 70], ['min', 'max'])
    expect(thumb('thumb-min').getAttribute('aria-valuenow')).toBe('20')
    expect(thumb('thumb-max').getAttribute('aria-valuenow')).toBe('70')

    // The second DOM thumb drives values[1].
    React.act(() => {
      thumb('thumb-max').dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(log).toEqual([[20, 71]])

    // Growth binds the new mount to the new slot; insertion order follows
    // DOM position, not claim age.
    await renderRange([10, 15, 20], ['min', 'mid', 'max'])
    expect(thumb('thumb-min').getAttribute('aria-valuenow')).toBe('10')
    expect(thumb('thumb-mid').getAttribute('aria-valuenow')).toBe('15')
    expect(thumb('thumb-max').getAttribute('aria-valuenow')).toBe('20')

    // Shrink rebinds the survivors by DOM position.
    await renderRange([10, 20], ['min', 'max'])
    expect(thumb('thumb-min').getAttribute('aria-valuenow')).toBe('10')
    expect(thumb('thumb-max').getAttribute('aria-valuenow')).toBe('20')
  })

  it('SD-KEY-07: modified arrows pass through with no preventDefault and no onChange', async () => {
    mockRects()
    const log: unknown[] = []
    let consumerSeen = 0
    await renderUi(
      <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)}>
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb" aria-label="T" onKeyDown={() => void consumerSeen++} />
        </Slider.Track>
      </Slider>
    )
    const presses: Array<Partial<KeyboardEventInit> & { key: string }> = [
      { key: 'ArrowRight', shiftKey: true },
      { key: 'ArrowLeft', shiftKey: true },
      { key: 'ArrowUp', shiftKey: true },
      { key: 'ArrowDown', shiftKey: true },
      { key: 'ArrowRight', ctrlKey: true },
      { key: 'ArrowRight', altKey: true },
      { key: 'ArrowRight', metaKey: true },
      { key: 'PageUp', shiftKey: true },
      { key: 'Home', shiftKey: true },
    ]
    for (const init of presses) {
      const event = keyEvent('keydown', init)
      React.act(() => {
        thumb().dispatchEvent(event)
      })
      expect(event.defaultPrevented).toBe(false)
    }
    expect(log).toEqual([])
    expect(consumerSeen).toBe(presses.length)
    expect(thumb().getAttribute('aria-valuenow')).toBe('20')
    expect(thumb().hasAttribute('data-focus-visible')).toBe(false)

    // Unmodified keys still step.
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(log).toEqual([21])
  })

  it('SD-POINTER-07: Root and the active Thumb carry data-dragging for the session', async () => {
    mockRects()
    const log: unknown[] = []
    const ends: unknown[] = []
    await renderUi(
      <Slider
        value={[20, 80]}
        min={0}
        max={100}
        step={1}
        id="slider"
        onChange={next => void log.push(next)}
        onChangeEnd={next => void ends.push(next)}
      >
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb-0" aria-label="Min" />
          <Slider.Thumb id="thumb-1" aria-label="Max" />
        </Slider.Track>
      </Slider>
    )
    expect(rootEl().hasAttribute('data-dragging')).toBe(false)

    // Track press near 30 moves index 0: Root + thumb-0 hook, thumb-1 clean.
    React.act(() => {
      container
        .querySelector('#track')!
        .dispatchEvent(pointerEvent('pointerdown', { clientX: 30, clientY: 5 }))
    })
    expect(log).toEqual([[30, 80]])
    expect(rootEl().hasAttribute('data-dragging')).toBe(true)
    expect(thumb('thumb-0').hasAttribute('data-dragging')).toBe(true)
    expect(thumb('thumb-0').hasAttribute('data-active')).toBe(true)
    expect(thumb('thumb-1').hasAttribute('data-dragging')).toBe(false)

    // Release clears every hook and still ends once.
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 30 }))
    })
    expect(ends).toEqual([[30, 80]])
    expect(rootEl().hasAttribute('data-dragging')).toBe(false)
    expect(thumb('thumb-0').hasAttribute('data-dragging')).toBe(false)
    expect(thumb('thumb-0').hasAttribute('data-active')).toBe(false)

    // Cancel clears the hooks with no end report.
    React.act(() => {
      container
        .querySelector('#track')!
        .dispatchEvent(pointerEvent('pointerdown', { clientX: 10, clientY: 5 }))
    })
    expect(rootEl().hasAttribute('data-dragging')).toBe(true)
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointercancel', { pointerId: 1 }))
    })
    expect(ends).toEqual([[30, 80]])
    expect(rootEl().hasAttribute('data-dragging')).toBe(false)
    expect(thumb('thumb-0').hasAttribute('data-dragging')).toBe(false)
  })
})
