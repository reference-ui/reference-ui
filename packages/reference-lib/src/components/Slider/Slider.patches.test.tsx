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

function keyEvent(
  type: 'keydown' | 'keyup',
  init: Partial<KeyboardEventInit> & { key: string }
) {
  return new window.KeyboardEvent(type, { bubbles: true, cancelable: true, ...init })
}

class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
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

// Listener exceptions never propagate out of dispatchEvent (DOM spec); they
// surface as window 'error' events. Capture them to assert interaction throws.
function captureWindowErrors() {
  const messages: string[] = []
  const onError = (e: Event) => {
    e.preventDefault()
    const err = (e as ErrorEvent).error as Error | undefined
    messages.push(String(err?.message ?? (e as ErrorEvent).message ?? 'unknown'))
  }
  window.addEventListener('error', onError)
  return { messages, release: () => window.removeEventListener('error', onError) }
}

function expectWindowError(messages: string[], pattern: RegExp) {
  expect(messages.join('\n')).toMatch(pattern)
}

describe('Slider PATCHES pins', () => {
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

  it('SD-KEY-02: reverses only horizontal Left/Right arrows under inherited RTL', async () => {
    mockRects()
    const log: unknown[] = []
    let value: SliderValue = 20
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <div dir="rtl">
          <Slider
            value={v}
            min={0}
            max={100}
            step={1}
            onChange={next => {
              log.push(next)
            }}
          >
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
        </div>
      )
    await renderCtl(value)
    const accept = async (v: SliderValue) => {
      value = v
      await renderCtl(value)
    }

    const press = async (key: string) => {
      React.act(() => {
        thumb().dispatchEvent(keyEvent('keydown', { key }))
      })
      React.act(() => {
        thumb().dispatchEvent(keyEvent('keyup', { key }))
      })
    }

    await press('ArrowRight')
    expect(log).toEqual([19])
    await accept(19)
    await press('ArrowLeft')
    expect(log).toEqual([19, 20])
    await accept(20)
    await press('ArrowUp')
    expect(log).toEqual([19, 20, 21])
    await accept(21)
    await press('ArrowDown')
    expect(log).toEqual([19, 20, 21, 20])
  })

  it('SD-KEY-03: keeps vertical arrow semantics independent of RTL', async () => {
    mockRects()
    for (const dir of ['ltr', 'rtl'] as const) {
      const log: unknown[] = []
      let value: SliderValue = 20
      const renderCtl = (v: SliderValue) =>
        renderUi(
          <div dir={dir}>
            <Slider value={v} min={0} max={100} step={1} orientation="vertical" onChange={next => void log.push(next)}>
              <Slider.Track id="track">
                <Slider.Range />
                <Slider.Thumb id="thumb" aria-label="T" />
              </Slider.Track>
            </Slider>
          </div>
        )
      await renderCtl(value)
      const press = async (key: string) => {
        React.act(() => {
          thumb().dispatchEvent(keyEvent('keydown', { key }))
        })
        value = log[log.length - 1] as number
        await renderCtl(value)
      }
      await press('ArrowUp')
      await press('ArrowRight')
      await press('ArrowDown')
      await press('ArrowLeft')
      expect(log).toEqual([21, 22, 21, 20])
    }
  })

  it('SD-KEY-04: snaps Page steps to the grid with one callback per keydown', async () => {
    mockRects()
    const log: unknown[] = []
    await renderUi(
      <Slider defaultValue={48} min={0} max={100} step={6} onChange={next => void log.push(next)}>
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb" aria-label="T" />
        </Slider.Track>
      </Slider>
    )
    // Page step for 0..100,step=6 is 12: 48 -> 60 -> 72 -> 60.
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'PageUp' }))
    })
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'PageUp', repeat: true }))
    })
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'PageDown' }))
    })
    expect(log).toEqual([60, 72, 60])
  })

  it('SD-END-02: treats key repeats as one interaction ending on the matching keyup', async () => {
    mockRects()
    const log: unknown[] = []
    const ends: unknown[] = []
    await renderUi(
      <Slider
        defaultValue={20}
        min={0}
        max={100}
        step={1}
        onChange={next => void log.push(next)}
        onChangeEnd={next => void ends.push(next)}
      >
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb" aria-label="T" />
        </Slider.Track>
      </Slider>
    )
    // Separate acts: real keydowns are separate tasks with a flush between.
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
    })
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight', repeat: true }))
    })
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight', repeat: true }))
    })
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight', repeat: true }))
    })
    expect(log).toEqual([21, 22, 23, 24])
    expect(ends).toEqual([])
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keyup', { key: 'ArrowRight' }))
    })
    expect(ends).toEqual([24])
    // A second keyup and a modifier release do nothing.
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keyup', { key: 'ArrowRight' }))
      thumb().dispatchEvent(keyEvent('keyup', { key: 'Shift' }))
    })
    expect(ends).toEqual([24])
  })

  it('SD-END-02: bound keydowns that change nothing create no completion', async () => {
    mockRects()
    const log: unknown[] = []
    const ends: unknown[] = []
    await renderUi(
      <Slider
        defaultValue={0}
        min={0}
        max={100}
        step={1}
        onChange={next => void log.push(next)}
        onChangeEnd={next => void ends.push(next)}
      >
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb" aria-label="T" />
        </Slider.Track>
      </Slider>
    )
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'PageDown' }))
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowLeft' }))
    })
    expect(log).toEqual([])
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keyup', { key: 'PageDown' }))
      thumb().dispatchEvent(keyEvent('keyup', { key: 'ArrowLeft' }))
    })
    expect(ends).toEqual([])
  })

  it('SD-END-03: canceled pointer sessions stay silent and clear once', async () => {
    mockRects()
    const cancels = [
      'pointercancel',
      'lostpointercapture',
      'buttons-zero',
      'window-blur',
      'disable',
      'unmount',
    ] as const
    for (const kind of cancels) {
      const log: unknown[] = []
      const ends: unknown[] = []
      let disabled = false
      const renderCtl = () =>
        renderUi(
          <Slider
            value={20}
            min={0}
            max={100}
            step={1}
            disabled={disabled}
            onChange={next => void log.push(next)}
            onChangeEnd={next => void ends.push(next)}
          >
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
        )
      await renderCtl()

      // Start a changed session: track press at x=60 requests 60.
      React.act(() => {
        track().dispatchEvent(pointerEvent('pointerdown', { clientX: 60, clientY: 5 }))
      })
      expect(log).toEqual([60])

      if (kind === 'pointercancel') {
        React.act(() => {
          window.dispatchEvent(pointerEvent('pointercancel', { pointerId: 1 }))
        })
      } else if (kind === 'lostpointercapture') {
        React.act(() => {
          window.dispatchEvent(new window.Event('lostpointercapture'))
        })
      } else if (kind === 'buttons-zero') {
        React.act(() => {
          window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, buttons: 0, clientX: 70 }))
        })
      } else if (kind === 'window-blur') {
        React.act(() => {
          window.dispatchEvent(new window.Event('blur'))
        })
      } else if (kind === 'disable') {
        disabled = true
        await renderCtl()
      } else if (kind === 'unmount') {
        await React.act(async () => {
          root.unmount()
        })
      }

      expect(ends).toEqual([])
      // Later movement from the stale pointer issues nothing.
      React.act(() => {
        window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 80 }))
        window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 80 }))
      })
      expect(log).toEqual([60])
      expect(ends).toEqual([])

      if (kind === 'unmount') {
        // Recreate the root for afterEach teardown.
        root = createRoot(container)
      } else {
        expect(thumb().hasAttribute('data-active')).toBe(false)
      }
    }
  })

  it('SD-END-03: removing the dragged thumb cancels its session', async () => {
    mockRects()
    const log: unknown[] = []
    const ends: unknown[] = []
    const renderRange = (count: 2 | 1) =>
      renderUi(
        <Slider
          value={count === 2 ? [20, 80] : [20]}
          min={0}
          max={100}
          step={1}
          onChange={next => void log.push(next)}
          onChangeEnd={next => void ends.push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb index={0} id="thumb-0" aria-label="Min" />
            {count === 2 && <Slider.Thumb index={1} id="thumb-1" aria-label="Max" />}
          </Slider.Track>
        </Slider>
      )
    await renderRange(2)

    // Press the second thumb and drag toward 70: changed session on index 1.
    React.act(() => {
      thumb('thumb-1').dispatchEvent(pointerEvent('pointerdown', { clientX: 80, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 70 }))
    })
    expect(log).toEqual([[20, 70]])

    // Removing the dragged thumb cancels: release commits nothing.
    await renderRange(1)
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 60 }))
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 60 }))
    })
    expect(log).toEqual([[20, 70]])
    expect(ends).toEqual([])
  })

  it('SD-END-03: keyboard sessions invalidated before keyup stay silent', async () => {
    mockRects()
    for (const kind of ['blur', 'disable', 'unmount'] as const) {
      const log: unknown[] = []
      const ends: unknown[] = []
      let disabled = false
      const renderCtl = () =>
        renderUi(
          <Slider
            value={20}
            min={0}
            max={100}
            step={1}
            disabled={disabled}
            onChange={next => void log.push(next)}
            onChangeEnd={next => void ends.push(next)}
          >
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
        )
      await renderCtl()
      React.act(() => {
        thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
      })
      expect(log).toEqual([21])

      if (kind === 'blur') {
        React.act(() => {
          thumb().dispatchEvent(new window.FocusEvent('blur', { bubbles: true }))
        })
      } else if (kind === 'disable') {
        disabled = true
        await renderCtl()
      } else {
        await React.act(async () => {
          root.unmount()
        })
      }

      if (kind !== 'unmount') {
        React.act(() => {
          thumb().dispatchEvent(keyEvent('keyup', { key: 'ArrowRight' }))
        })
      }
      expect(ends).toEqual([])

      if (kind === 'unmount') {
        root = createRoot(container)
      }
    }
  })

  it('SD-END-04: rejected requests end with the last requested candidate on the latest handler', async () => {
    mockRects()
    const log: unknown[] = []
    const endsA: unknown[] = []
    const endsB: unknown[] = []
    let useB = false
    // Controlled parent rejects everything: value stays 20.
    const renderCtl = () =>
      renderUi(
        <Slider
          value={20}
          min={0}
          max={100}
          step={1}
          onChange={next => void log.push(next)}
          onChangeEnd={next => void (useB ? endsB : endsA).push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb" aria-label="T" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl()

    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 40, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 60 }))
    })
    expect(log).toEqual([40, 60])
    expect(thumb().getAttribute('aria-valuenow')).toBe('20')

    // Replace the end handler mid-session, then release.
    useB = true
    await renderCtl()
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 60 }))
    })
    expect(endsA).toEqual([])
    expect(endsB).toEqual([60])
    expect(thumb().getAttribute('aria-valuenow')).toBe('20')
  })

  it('SD-END-04: programmatic updates and bound no-ops emit no completion', async () => {
    mockRects()
    const log: unknown[] = []
    const ends: unknown[] = []
    let value: SliderValue = 20
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider
          value={v}
          min={0}
          max={100}
          step={1}
          onChange={next => void log.push(next)}
          onChangeEnd={next => void ends.push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb" aria-label="T" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl(value)
    value = 55
    await renderCtl(value)
    expect(thumb().getAttribute('aria-valuenow')).toBe('55')
    expect(log).toEqual([])
    expect(ends).toEqual([])

    // A real session still completes normally.
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
      thumb().dispatchEvent(keyEvent('keyup', { key: 'ArrowRight' }))
    })
    expect(log).toEqual([56])
    expect(ends).toEqual([56])

    // Bound no-op key: handled, silent, creates no completion.
    value = 100
    await renderCtl(value)
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
      thumb().dispatchEvent(keyEvent('keyup', { key: 'ArrowRight' }))
    })
    expect(log).toEqual([56])
    expect(ends).toEqual([56])
  })

  it('SD-DOM-05: diagnoses value-to-Thumb count mismatches when interaction begins', async () => {
    mockRects()
    const silence = quietConsole()
    try {
      // Scalar value with two thumbs: pressing the unmatched thumb throws.
      const log: unknown[] = []
      await renderUi(
        <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb index={0} id="thumb-0" aria-label="A" />
            <Slider.Thumb index={1} id="thumb-1" aria-label="B" />
          </Slider.Track>
        </Slider>
      )
      // Nothing publishes NaN before the interaction.
      for (const el of Array.from(container.querySelectorAll('[role="slider"]'))) {
        expect(el.getAttribute('aria-valuenow')).not.toBe('NaN')
        expect(el.getAttribute('aria-valuemin')).not.toBe('NaN')
        expect(el.getAttribute('aria-valuemax')).not.toBe('NaN')
        expect(el.getAttribute('style')).not.toContain('NaN')
      }
      const errs = captureWindowErrors()
      React.act(() => {
        thumb('thumb-1').dispatchEvent(pointerEvent('pointerdown', { clientX: 20, clientY: 5 }))
      })
      errs.release()
      expectWindowError(errs.messages, /Value-to-Thumb count mismatch/)
      expect(log).toEqual([])

      // Array value with one thumb: any interaction throws.
      await renderUi(
        <Slider value={[20, 80]} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb index={0} id="thumb-0" aria-label="A" />
          </Slider.Track>
        </Slider>
      )
      const errs2 = captureWindowErrors()
      React.act(() => {
        thumb('thumb-0').dispatchEvent(pointerEvent('pointerdown', { clientX: 20, clientY: 5 }))
      })
      React.act(() => {
        thumb('thumb-0').dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
      })
      errs2.release()
      expectWindowError(errs2.messages, /Value-to-Thumb count mismatch/)
      expect(log).toEqual([])

      // Scalar value with zero thumbs: a track press throws.
      await renderUi(
        <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
          </Slider.Track>
        </Slider>
      )
      const errs3 = captureWindowErrors()
      React.act(() => {
        track().dispatchEvent(pointerEvent('pointerdown', { clientX: 60, clientY: 5 }))
      })
      errs3.release()
      expectWindowError(errs3.messages, /Value-to-Thumb count mismatch/)
      expect(log).toEqual([])
    } finally {
      silence.mockRestore()
    }
  })

  it('SD-DOM-12: rejects duplicate Track/Range anatomy at commit', async () => {
    mockRects()
    const silence = quietConsole()
    try {
      await renderUi(
        <Boundary key="dup-track">
          <Slider value={20}>
            <Slider.Track id="track-a">
              <Slider.Range />
              <Slider.Thumb index={0} aria-label="A" />
            </Slider.Track>
            <Slider.Track id="track-b">
              <Slider.Thumb index={0} aria-label="B" />
            </Slider.Track>
          </Slider>
        </Boundary>
      )
      expect(container.querySelector('[data-testid="boundary-error"]')?.textContent).toMatch(
        /Exactly one Slider\.Track/
      )

      await renderUi(
        <Boundary key="dup-range">
          <Slider value={20}>
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Range />
              <Slider.Thumb index={0} aria-label="A" />
            </Slider.Track>
          </Slider>
        </Boundary>
      )
      expect(container.querySelector('[data-testid="boundary-error"]')?.textContent).toMatch(
        /At most one Slider\.Range/
      )
    } finally {
      silence.mockRestore()
    }
  })

  it('SD-DOM-12: missing Track and out-of-sequence thumbs fail before any capture', async () => {
    mockRects()
    const silence = quietConsole()
    try {
      const log: unknown[] = []
      // Thumb with no Track anywhere: key interaction throws the anatomy error.
      await renderUi(
        <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Thumb index={0} id="thumb" aria-label="A" />
        </Slider>
      )
      const errs = captureWindowErrors()
      React.act(() => {
        thumb().dispatchEvent(pointerEvent('pointerdown', { clientX: 20, clientY: 5 }))
      })
      errs.release()
      expectWindowError(errs.messages, /requires a Slider\.Track/)
      // No partial session: later window movement issues nothing.
      React.act(() => {
        window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 80 }))
        window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 80 }))
      })
      expect(log).toEqual([])

      // Thumb outside the value-matched sequence: interaction throws.
      await renderUi(
        <Slider value={20} min={0} max={100} step={1} onChange={next => void log.push(next)}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb index={5} id="thumb" aria-label="A" />
          </Slider.Track>
        </Slider>
      )
      expect(thumb().getAttribute('aria-valuenow')).not.toBe('NaN')
      const errs2 = captureWindowErrors()
      React.act(() => {
        thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
      })
      errs2.release()
      expectWindowError(errs2.messages, /Value-to-Thumb count mismatch/)
      expect(log).toEqual([])
    } finally {
      silence.mockRestore()
    }
  })

  it('SD-CTRL-07: rejects programmatic arrays that violate the minimum distance', async () => {
    mockRects()
    const silence = quietConsole()
    try {
      const log: unknown[] = []
      let value: SliderValue = [20, 80]
      const renderCtl = (v: SliderValue) =>
        renderUi(
          <Boundary>
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
                <Slider.Thumb index={0} id="thumb-0" aria-label="Min" />
                <Slider.Thumb index={1} id="thumb-1" aria-label="Max" />
              </Slider.Track>
            </Slider>
          </Boundary>
        )
      await renderCtl(value)
      expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('20')

      // [40, 60] has a 20-unit gap below the required 30: atomic rejection.
      value = [40, 60]
      await renderCtl(value)
      expect(container.querySelector('[data-testid="boundary-error"]')?.textContent).toMatch(
        /violates minimum required distance/
      )
      expect(log).toEqual([])

      // Exact-boundary [50, 80] succeeds on a fresh tree (new boundary key).
      await renderUi(
        <Boundary key="fresh">
          <Slider
            value={[50, 80]}
            min={0}
            max={100}
            step={10}
            minStepsBetweenThumbs={3}
            onChange={next => void log.push(next)}
          >
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb index={0} id="thumb-0" aria-label="Min" />
              <Slider.Thumb index={1} id="thumb-1" aria-label="Max" />
            </Slider.Track>
          </Slider>
        </Boundary>
      )
      expect(container.querySelector('[data-testid="boundary-error"]')).toBeNull()
      expect(thumb('thumb-0').getAttribute('aria-valuenow')).toBe('50')
      expect(thumb('thumb-0').getAttribute('aria-valuemax')).toBe('50')
      expect(thumb('thumb-1').getAttribute('aria-valuemin')).toBe('80')
    } finally {
      silence.mockRestore()
    }
  })

  it('SD-CTRL-05: uses current props when configuration changes during a drag', async () => {
    mockRects()
    const oldLog: unknown[] = []
    const newLog: unknown[] = []
    let swapped = false
    let value: SliderValue = 20
    const renderCtl = () =>
      renderUi(
        <Slider
          value={value}
          min={0}
          max={swapped ? 60 : 100}
          step={swapped ? 5 : 1}
          onChange={next => void (swapped ? newLog : oldLog).push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb id="thumb" aria-label="T" />
          </Slider.Track>
        </Slider>
      )
    await renderCtl()

    // Press at x=40 under the old configuration.
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 40, clientY: 5 }))
    })
    expect(oldLog).toEqual([40])

    // Swap value, bounds, step, and handler mid-drag.
    swapped = true
    value = 30
    await renderCtl()

    // Move to x=80 under the new configuration: 0.8 * 60 = 48 -> snap 5 -> 50.
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 80 }))
    })
    expect(newLog).toEqual([50])
    expect(oldLog).toEqual([40])
  })

  it('SD-DYNAMIC-02: rerendered constraints apply to the next interaction', async () => {
    mockRects()
    const log: unknown[] = []
    const ends: unknown[] = []
    let dir: 'ltr' | 'rtl' = 'ltr'
    const renderCtl = (sliderProps: Record<string, unknown>) =>
      renderUi(
        <div dir={dir}>
          <Slider
            value={20}
            min={0}
            max={100}
            step={1}
            onChange={next => void log.push(next)}
            onChangeEnd={next => void ends.push(next)}
            {...(sliderProps as object)}
          >
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
        </div>
      )
    await renderCtl({})

    // Rerender as min=10, max=60, step=5, vertical, RTL: ARIA updates, silent.
    dir = 'rtl'
    await renderCtl({ min: 10, max: 60, step: 5, orientation: 'vertical' })
    expect(thumb().getAttribute('aria-orientation')).toBe('vertical')
    expect(thumb().getAttribute('aria-valuemin')).toBe('10')
    expect(thumb().getAttribute('aria-valuemax')).toBe('60')
    expect(log).toEqual([])
    expect(ends).toEqual([])

    // Next key uses the new grid: (20-10)/5 = 2 -> 3 -> 25.
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(log).toEqual([25])

    // Horizontal RTL flips Left to an increase under the new bounds.
    await renderCtl({ min: 10, max: 60, step: 5, orientation: 'horizontal' })
    React.act(() => {
      thumb().dispatchEvent(keyEvent('keydown', { key: 'ArrowLeft' }))
    })
    expect(log).toEqual([25, 25])
  })

  it('SD-DYNAMIC-03: discards stale drag state when cardinality changes mid-gesture', async () => {
    mockRects()
    const log: unknown[] = []
    const ends: unknown[] = []
    let value: SliderValue = [10, 20, 30]
    const renderCtl = (v: SliderValue) =>
      renderUi(
        <Slider
          value={v}
          min={0}
          max={100}
          step={1}
          onChange={next => void log.push(next)}
          onChangeEnd={next => void ends.push(next)}
        >
          <Slider.Track id="track">
            <Slider.Range />
            {Array.isArray(v) &&
              v.map((_, i) => <Slider.Thumb key={i} index={i} id={`thumb-${i}`} aria-label={`T${i}`} />)}
          </Slider.Track>
        </Slider>
      )
    await renderCtl(value)

    // Drag index 2, then shrink the range mid-gesture.
    React.act(() => {
      thumb('thumb-2').dispatchEvent(pointerEvent('pointerdown', { clientX: 30, clientY: 5 }))
    })
    value = [10, 20]
    await renderCtl(value)
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 90 }))
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 90 }))
    })
    expect(log).toEqual([])
    expect(ends).toEqual([])

    // Grow mid-gesture: the old release commits nothing.
    value = [10, 20]
    await renderCtl(value)
    React.act(() => {
      thumb('thumb-1').dispatchEvent(pointerEvent('pointerdown', { clientX: 20, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 40 }))
    })
    expect(log).toEqual([[10, 40]])
    value = [10, 20, 30]
    await renderCtl(value)
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 50 }))
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 50 }))
    })
    expect(log).toEqual([[10, 40]])
    expect(ends).toEqual([])

    // A new index-2 drag can request after the growth.
    React.act(() => {
      thumb('thumb-2').dispatchEvent(pointerEvent('pointerdown', { clientX: 30, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 100 }))
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 100 }))
    })
    expect(log).toEqual([[10, 40], [10, 20, 100]])
    expect(ends).toEqual([[10, 20, 100]])
  })

  it('SD-DOM-06: anchors Range endpoints to the axis direction', async () => {
    mockRects()
    const rangeStyle = () =>
      (container.querySelector('[data-reference-slider-range]') as HTMLElement).getAttribute('style') ?? ''

    // Horizontal LTR scalar 30: left 0%, width 30%.
    await renderUi(
      <Slider value={30}>
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb index={0} aria-label="T" />
        </Slider.Track>
      </Slider>
    )
    expect(rangeStyle()).toContain('--reference-slider-range-start: 0%')
    expect(rangeStyle()).toContain('--reference-slider-range-end: 30%')
    expect(rangeStyle()).toContain('left: 0%')

    // Horizontal LTR range [20, 70]: left 20%, width 50%.
    await renderUi(
      <Slider value={[20, 70]}>
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb index={0} aria-label="Min" />
          <Slider.Thumb index={1} aria-label="Max" />
        </Slider.Track>
      </Slider>
    )
    expect(rangeStyle()).toContain('--reference-slider-range-start: 20%')
    expect(rangeStyle()).toContain('--reference-slider-range-end: 70%')
    expect(rangeStyle()).toContain('left: 20%')

    // Horizontal RTL scalar 30: right 0%, width 30%, no left.
    await renderUi(
      <div dir="rtl">
        <Slider value={30}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb index={0} aria-label="T" />
          </Slider.Track>
        </Slider>
      </div>
    )
    expect(rangeStyle()).toContain('--reference-slider-range-start: 0%')
    expect(rangeStyle()).toContain('--reference-slider-range-end: 30%')
    expect(rangeStyle()).toContain('right: 0%')
    expect(rangeStyle()).not.toContain('left:')

    // Horizontal RTL range [20, 70]: right 20%, width 50%.
    await renderUi(
      <div dir="rtl">
        <Slider value={[20, 70]}>
          <Slider.Track id="track">
            <Slider.Range />
            <Slider.Thumb index={0} aria-label="Min" />
            <Slider.Thumb index={1} aria-label="Max" />
          </Slider.Track>
        </Slider>
      </div>
    )
    expect(rangeStyle()).toContain('--reference-slider-range-start: 20%')
    expect(rangeStyle()).toContain('--reference-slider-range-end: 70%')
    expect(rangeStyle()).toContain('right: 20%')

    // Vertical scalar 30: bottom 0%, height 30%.
    await renderUi(
      <Slider value={30} orientation="vertical">
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb index={0} aria-label="T" />
        </Slider.Track>
      </Slider>
    )
    expect(rangeStyle()).toContain('bottom: 0%')
    expect(rangeStyle()).toContain('height: 30%')
  })

  it('SD-POINTER-09: defers pointer geometry while the track is zero-sized', async () => {
    // No rect mock: happy-dom reports a 0x0 rect.
    const log: unknown[] = []
    const ends: unknown[] = []
    await renderUi(
      <Slider
        value={20}
        min={0}
        max={100}
        step={1}
        onChange={next => void log.push(next)}
        onChangeEnd={next => void ends.push(next)}
      >
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb" aria-label="T" />
        </Slider.Track>
      </Slider>
    )
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 60, clientY: 5 }))
    })
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 80 }))
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 80 }))
    })
    expect(log).toEqual([])
    expect(ends).toEqual([])
    expect(thumb().hasAttribute('data-active')).toBe(false)
    const html = container.innerHTML
    expect(html).not.toContain('NaN')

    // Measurable again: the same press requests normally.
    mockRects()
    React.act(() => {
      track().dispatchEvent(pointerEvent('pointerdown', { clientX: 60, clientY: 5 }))
    })
    expect(log).toEqual([60])
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 60 }))
    })
    expect(ends).toEqual([60])
  })

  it('SD-POINTER-10: maps physical pointer positions per orientation and direction', async () => {
    mockRects()
    const log: unknown[] = []
    const renderCtl = (dir: 'ltr' | 'rtl', orientation: 'horizontal' | 'vertical') =>
      renderUi(
        <div dir={dir}>
          <Slider
            value={50}
            min={0}
            max={100}
            step={1}
            orientation={orientation}
            onChange={next => void log.push(next)}
          >
            <Slider.Track id="track">
              <Slider.Range />
              <Slider.Thumb id="thumb" aria-label="T" />
            </Slider.Track>
          </Slider>
        </div>
      )
    const press = (clientX: number, clientY: number) => {
      React.act(() => {
        track().dispatchEvent(pointerEvent('pointerdown', { clientX, clientY }))
      })
      React.act(() => {
        window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX, clientY }))
      })
    }

    await renderCtl('ltr', 'horizontal')
    press(0, 5)
    press(100, 5)
    expect(log).toEqual([0, 100])

    log.length = 0
    await renderCtl('rtl', 'horizontal')
    press(0, 5)
    press(100, 5)
    expect(log).toEqual([100, 0])

    mockRects(trackRect({ left: 0, right: 10, top: 0, bottom: 100 }))
    log.length = 0
    await renderCtl('ltr', 'vertical')
    press(5, 100)
    press(5, 0)
    expect(log).toEqual([0, 100])
  })

  it('SD-POINTER-03: preserves the grab offset instead of jumping to center', async () => {
    // 100px vertical track; thumb at 50 has its center at clientY=50.
    mockRects(trackRect({ left: 0, right: 10, top: 0, bottom: 100 }))
    const log: unknown[] = []
    await renderUi(
      <Slider
        value={50}
        min={0}
        max={100}
        step={1}
        orientation="vertical"
        onChange={next => void log.push(next)}
      >
        <Slider.Track id="track">
          <Slider.Range />
          <Slider.Thumb id="thumb" aria-label="T" />
        </Slider.Track>
      </Slider>
    )
    // Press 10px below center: no request on the press itself.
    React.act(() => {
      thumb().dispatchEvent(pointerEvent('pointerdown', { clientX: 5, clientY: 60 }))
    })
    expect(log).toEqual([])
    // Move to clientY=80: offset-preserved 30, not center-mapped 20.
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 5, clientY: 80 }))
    })
    expect(log).toEqual([30])
    React.act(() => {
      window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 5, clientY: 80 }))
    })
  })
})
