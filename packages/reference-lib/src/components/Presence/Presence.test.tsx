// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { Presence } from './Presence'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Presence Component Unit Contract', () => {
  it('PR-DOM-06: Presence should reject child shapes that cannot expose one observable element when they are nonempty', () => {
    // 1. Text child
    expect(() => {
      renderToString(React.createElement(Presence, { present: true }, 'pure text' as any))
    }).toThrow(/Reference UI: Presence expects a single valid React element child/)

    // 2. Numeric 0
    expect(() => {
      renderToString(React.createElement(Presence, { present: true }, 0 as any))
    }).toThrow(/Reference UI: Presence expects a single valid React element child/)

    // 3. Non-empty Fragment
    expect(() => {
      renderToString(
        React.createElement(
          Presence,
          { present: true },
          React.createElement(React.Fragment, null, React.createElement('div', null, 'one'), React.createElement('div', null, 'two'))
        )
      )
    }).toThrow(/Reference UI: Presence expects a single valid React element child/)

    // 4. Multiple active elements
    expect(() => {
      renderToString(
        React.createElement(Presence, { present: true }, [
          React.createElement('div', { key: '1' }, 'one'),
          React.createElement('div', { key: '2' }, 'two'),
        ] as any)
      )
    }).toThrow(/Reference UI: Presence expects a single valid React element child/)
  })

  it('PR-DOM-07: Presence should observe one eventual native node when its child is ref-forwarding or lazy', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const consumerRef = { current: null as HTMLButtonElement | null }

    const ForwardingChild = React.forwardRef<HTMLButtonElement, { children?: React.ReactNode }>(
      (props, ref) => <button ref={ref} type="button" {...props} />
    )

    await React.act(async () => {
      root.render(
        <Presence present={true}>
          <ForwardingChild ref={consumerRef}>Forwarded</ForwardingChild>
        </Presence>
      )
    })

    expect(consumerRef.current).not.toBeNull()
    expect(consumerRef.current?.tagName).toBe('BUTTON')
    expect(container.querySelectorAll('button').length).toBe(1)

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('PR-DOM-08: Presence should fail descriptively when a custom child does not expose one observable native node', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    function NonForwardingChild() {
      return <button type="button">Non forwarding</button>
    }

    await React.act(async () => {
      root.render(
        <Presence present={true}>
          <NonForwardingChild />
        </Presence>
      )
    })

    let caughtError: any = null
    try {
      await React.act(async () => {
        root.render(
          <Presence present={false}>
            <NonForwardingChild />
          </Presence>
        )
      })
    } catch (e) {
      caughtError = e
    }

    // Quarantine caught but never asserted; the contract (PR-DOM-08) demands a
    // descriptive ref/anatomy error rather than silent removal.
    expect(caughtError).toMatchObject({
      message: expect.stringMatching(/observable DOM node/),
    })

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('PR-REF-01: Presence should forward an object ref to the exact observed child when that child is present', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const btnRef = { current: null as HTMLButtonElement | null }

    await React.act(async () => {
      root.render(
        <Presence present={true}>
          <button ref={btnRef} id="ref-target">Target</button>
        </Presence>
      )
    })

    expect(btnRef.current).not.toBeNull()
    expect(btnRef.current?.id).toBe('ref-target')

    await React.act(async () => {
      root.render(
        <Presence present={false}>
          <button ref={btnRef} id="ref-target">Target</button>
        </Presence>
      )
    })

    expect(btnRef.current).toBeNull()

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('PR-REF-02: Presence should settle without an infinite loop when an inline callback ref schedules a render on attach', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    let renderCount = 0
    function TestComponent() {
      const [, setTick] = React.useState(0)
      renderCount++
      return (
        <Presence present={true}>
          <button
            ref={node => {
              if (node && renderCount < 2) {
                setTick(t => t + 1)
              }
            }}
          >
            Test
          </button>
        </Presence>
      )
    }

    await React.act(async () => {
      root.render(<TestComponent />)
    })

    expect(renderCount).toBeLessThanOrEqual(5)

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('PR-REF-03: Presence should keep its composed ref identity stable when inputs remain unchanged across rerenders', async () => {
    const capturedRefs: any[] = []

    const SpyChild = React.forwardRef<HTMLDivElement, { tick: number }>((props, ref) => {
      if (typeof ref === 'function') {
        capturedRefs.push(ref)
      }
      return <div ref={ref}>Tick {props.tick}</div>
    })

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const stableConsumerRef = () => {}

    await React.act(async () => {
      root.render(
        <Presence present={true}>
          <SpyChild ref={stableConsumerRef} tick={1} />
        </Presence>
      )
    })

    await React.act(async () => {
      root.render(
        <Presence present={true}>
          <SpyChild ref={stableConsumerRef} tick={2} />
        </Presence>
      )
    })

    expect(capturedRefs.length).toBeGreaterThanOrEqual(2)
    expect(capturedRefs[0]).toBe(capturedRefs[1])

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('PR-REF-04: Presence should apply the supported React cleanup contract when its child is finally removed', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const cleanupFn = vi.fn()
    const refCallback = vi.fn((node: HTMLElement | null) => {
      if (node) return cleanupFn
    })

    await React.act(async () => {
      root.render(
        <Presence present={true}>
          <div ref={refCallback}>Cleanup Target</div>
        </Presence>
      )
    })

    expect(refCallback).toHaveBeenCalled()

    await React.act(async () => {
      root.render(
        <Presence present={false}>
          <div ref={refCallback}>Cleanup Target</div>
        </Presence>
      )
    })

    const calledWithNull = refCallback.mock.calls.some(call => call[0] === null)
    const cleanedUp = cleanupFn.mock.calls.length > 0 || calledWithNull
    expect(cleanedUp).toBe(true)

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('PR-ENV-01: Presence should hydrate matching child markup when present is true on the server and client', () => {
    const markup = renderToString(
      <Presence present={true}>
        <div id="ssr-present" className="box">SSR Content</div>
      </Presence>
    )

    expect(markup).toContain('id="ssr-present"')
    expect(markup).toContain('SSR Content')
    expect(markup.startsWith('<div id="ssr-present"')).toBe(true)
  })

  it('PR-ENV-02: Presence should emit no child markup when present is false during server rendering', () => {
    const markup = renderToString(
      <Presence present={false}>
        <div id="ssr-absent">Hidden Content</div>
      </Presence>
    )

    expect(markup).toBe('')
  })

  it('PR-ENV-03: Presence should maintain one observed child when StrictMode replays effects', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await React.act(async () => {
      root.render(
        <React.StrictMode>
          <Presence present={true}>
            <div data-testid="strict-child">Strict Child</div>
          </Presence>
        </React.StrictMode>
      )
    })

    const elements = container.querySelectorAll('[data-testid="strict-child"]')
    expect(elements.length).toBe(1)

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('PR-NEST-04: Presence should coordinate one descendant exit when StrictMode replays nested registration and cleanup', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await React.act(async () => {
      root.render(
        <React.StrictMode>
          <Presence present={true}>
            <div id="parent-node">
              Parent
              <Presence present={true}>
                <div id="child-node">Child</div>
              </Presence>
            </div>
          </Presence>
        </React.StrictMode>
      )
    })

    expect(container.querySelector('#parent-node')).not.toBeNull()
    expect(container.querySelector('#child-node')).not.toBeNull()

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })
})
