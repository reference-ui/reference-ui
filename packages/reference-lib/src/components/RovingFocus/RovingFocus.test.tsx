// @vitest-environment happy-dom
/** Component-level proof for RovingFocus: SSR tab-stop hydration, the
 * single-element anatomy errors through real renders, and the transparent
 * slot merge mechanics against mounted nodes. Pure-logic cases moved next
 * to their modules — typeahead, linear, grid, repair, merge, and guards. */

import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RovingFocus } from './RovingFocus'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('RovingFocus Unit Tests', () => {
  it('RF-ENV-01: RovingFocus should hydrate the same sole tab stop when server and client collections match', () => {
    const html = renderToString(
      <RovingFocus.Root orientation="horizontal" loop>
        <div role="toolbar" data-testid="ssr-toolbar">
          <RovingFocus.Item disabled>
            <button type="button" disabled data-testid="b-1">
              First Disabled
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item>
            <button type="button" data-testid="b-2">
              Second Enabled
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item>
            <button type="button" data-testid="b-3">
              Third Enabled
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    )

    expect(html).toContain('data-testid="ssr-toolbar"')
    expect(html).toMatch(/<button[^>]*data-testid="b-2"[^>]*tabindex="0"/)
    expect(html).toMatch(/<button[^>]*data-testid="b-1"[^>]*tabindex="-1"/)
    expect(html).toMatch(/<button[^>]*data-testid="b-3"[^>]*tabindex="-1"/)
    expect(html.startsWith('<div role="toolbar"')).toBe(true)
  })
})

// RF-DOM-06 shapes, bypassing type checking (children is typed as exactly one
// element; runtime must still reject whatever JS hands it).
const INVALID_CHILD_SHAPES: Array<{ name: string; make: () => unknown; message: RegExp }> = [
  { name: 'omitted', make: () => undefined, message: /received none/ },
  { name: 'null', make: () => null, message: /received none/ },
  { name: 'false', make: () => false, message: /received none/ },
  { name: 'text', make: () => 'hello', message: /received text/ },
  { name: 'number', make: () => 42, message: /received a number/ },
  {
    name: 'nonempty Fragment',
    make: () =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement('div'),
        React.createElement('div')
      ),
    message: /received a Fragment/,
  },
  {
    name: 'multiple elements',
    make: () => [React.createElement('div', { key: 'a' }), React.createElement('div', { key: 'b' })],
    message: /received 2 children/,
  },
]

describe('RF-DOM-06 single-element anatomy errors (FEATURES #3)', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it.each(INVALID_CHILD_SHAPES)(
    'Root throws a descriptive error for $name children',
    ({ make, message }) => {
      const el = React.createElement(RovingFocus.Root as any, null, make() as any)
      expect(() => renderToString(el)).toThrow(/RovingFocus\.Root expects exactly one element/)
      expect(() => renderToString(el)).toThrow(message)
    }
  )

  it.each(INVALID_CHILD_SHAPES)(
    'Item throws a descriptive error for $name children',
    ({ make, message }) => {
      const el = React.createElement(
        RovingFocus.Root,
        null,
        React.createElement(
          'div',
          null,
          React.createElement(RovingFocus.Item as any, null, make() as any)
        )
      )
      expect(() => renderToString(el)).toThrow(/RovingFocus\.Item expects exactly one element/)
      expect(() => renderToString(el)).toThrow(message)
    }
  )

  it('leaves no partial DOM or stale registration after a rejected render', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root: Root = createRoot(container)
    try {
      let error: unknown = null
      try {
        await React.act(async () => {
          root.render(
            React.createElement(
              RovingFocus.Root,
              null,
              React.createElement(
                'div',
                null,
                React.createElement(RovingFocus.Item as any, null, 'not-an-element' as any)
              )
            )
          )
        })
      } catch (e) {
        error = e
      }
      expect(String(error)).toMatch(/RovingFocus\.Item expects exactly one element/)
      expect(container.querySelectorAll('[tabindex]').length).toBe(0)

      // A subsequent valid mount settles exactly one tab stop: nothing stale leaked.
      await React.act(async () => {
        root.render(
          <RovingFocus.Root>
            <div>
              <RovingFocus.Item>
                <button type="button">One</button>
              </RovingFocus.Item>
              <RovingFocus.Item>
                <button type="button">Two</button>
              </RovingFocus.Item>
            </div>
          </RovingFocus.Root>
        )
      })
      expect(container.querySelectorAll('[tabindex="0"]').length).toBe(1)
      expect(container.querySelectorAll('[tabindex="-1"]').length).toBe(1)
    } finally {
      await React.act(async () => {
        root.unmount()
      })
      container.remove()
    }
  })
})

describe('transparent slot merge (FEATURES #2, RF-DOM-02 mechanics)', () => {
  async function mountUi(ui: React.ReactElement) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root: Root = createRoot(container)
    await React.act(async () => {
      root.render(ui)
    })
    return { container, root }
  }

  afterEach(async () => {
    document.body.innerHTML = ''
  })

  it('combines className, merges style child-wins, and chains refs onto the one child', async () => {
    const childRef = React.createRef<HTMLButtonElement>()
    const partRef = React.createRef<HTMLElement>()
    const { container, root } = await mountUi(
      <RovingFocus.Root>
        <div>
          <RovingFocus.Item
            id="slot-item"
            className="part-class"
            style={{ color: 'red', marginTop: 4 } as React.CSSProperties}
            ref={partRef}
          >
            <button
              type="button"
              data-testid="slot-btn"
              className="child-class"
              style={{ color: 'blue' }}
              ref={childRef}
            >
              Slot
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    )
    try {
      const btn = container.querySelector('[data-testid="slot-btn"]') as HTMLButtonElement
      expect(btn.className).toContain('part-class')
      expect(btn.className).toContain('child-class')
      expect(btn.style.color).toBe('blue')
      expect(btn.style.marginTop).toBe('4px')
      expect(childRef.current).toBe(btn)
      expect(partRef.current).toBe(btn)
      expect(btn.getAttribute('tabindex')).toBe('0')
    } finally {
      await React.act(async () => {
        root.unmount()
      })
    }
  })

  it('compiles the css prop onto the child and concatenates aria-describedby', async () => {
    const { container, root } = await mountUi(
      <RovingFocus.Root>
        <div>
          <RovingFocus.Item
            id="css-item"
            css={{ display: 'flex' }}
            aria-describedby="part-desc"
          >
            <button type="button" data-testid="css-btn" aria-describedby="child-desc">
              Styled
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    )
    try {
      const btn = container.querySelector('[data-testid="css-btn"]') as HTMLButtonElement
      expect(btn.className).toContain('reference-ui__')
      expect(btn.getAttribute('aria-describedby')).toBe('child-desc part-desc')
    } finally {
      await React.act(async () => {
        root.unmount()
      })
    }
  })

  it('runs handlers child-first and gates the kernel on consumer prevention (RF-KEY-08 mechanics)', async () => {
    const order: string[] = []
    const { container, root } = await mountUi(
      <RovingFocus.Root orientation="horizontal">
        <div>
          <RovingFocus.Item id="k-a">
            <button type="button" data-testid="k-a">
              A
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item
            id="k-b"
            onKeyDown={() => {
              order.push('part')
            }}
          >
            <button
              type="button"
              data-testid="k-b"
              onKeyDown={e => {
                order.push('child')
                e.preventDefault()
              }}
            >
              B
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    )
    try {
      const btnB = container.querySelector('[data-testid="k-b"]') as HTMLButtonElement
      const btnA = container.querySelector('[data-testid="k-a"]') as HTMLButtonElement
      await React.act(async () => {
        btnB.focus()
      })
      expect(document.activeElement).toBe(btnB)
      await React.act(async () => {
        btnB.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
      })
      expect(order).toEqual(['child'])
      expect(document.activeElement).toBe(btnB)
      expect(btnB.getAttribute('tabindex')).toBe('0')
      expect(btnA.getAttribute('tabindex')).toBe('-1')
    } finally {
      await React.act(async () => {
        root.unmount()
      })
    }
  })

  it('keeps tabIndex authoritative over conflicting consumer values (RF-TAB-08 mechanics)', async () => {
    const { container, root } = await mountUi(
      <RovingFocus.Root orientation="horizontal">
        <div>
          <RovingFocus.Item id="t-a" tabIndex={2}>
            <button type="button" data-testid="t-a" tabIndex={0}>
              A
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="t-b">
            <button type="button" data-testid="t-b" tabIndex={-1}>
              B
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    )
    try {
      expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
      expect((container.querySelector('[data-testid="t-a"]') as HTMLElement).getAttribute('tabindex')).toBe(
        '0'
      )
      expect((container.querySelector('[data-testid="t-b"]') as HTMLElement).getAttribute('tabindex')).toBe(
        '-1'
      )
    } finally {
      await React.act(async () => {
        root.unmount()
      })
    }
  })

  it('lets child native props win while the part fills gaps', async () => {
    const { container, root } = await mountUi(
      <RovingFocus.Root data-part="root-part" title="part-title">
        <div data-testid="slot-root-child" title="child-title">
          <RovingFocus.Item id="gap-item" title="item-part-title">
            <button type="button" data-testid="gap-btn">
              Gap
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    )
    try {
      const rootChild = container.querySelector('[data-testid="slot-root-child"]') as HTMLElement
      expect(rootChild.title).toBe('child-title')
      expect(rootChild.getAttribute('data-part')).toBe('root-part')
      expect(rootChild.tagName).toBe('DIV')
      // No Root host or Item wrapper: the authored nodes are all there is.
      expect(container.firstElementChild).toBe(rootChild)
      const btn = container.querySelector('[data-testid="gap-btn"]') as HTMLButtonElement
      expect(btn.title).toBe('item-part-title')
    } finally {
      await React.act(async () => {
        root.unmount()
      })
    }
  })
})
