// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Div, LayerScopeContext, ColorModeContext } from '@reference-ui/react'
import { Portal } from './Portal'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Portal & Layer Scope Theme Inheritance', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'root-container'
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
    document.documentElement.removeAttribute('data-color-mode')
    document.body.removeAttribute('data-color-mode')
    // Remove any portaled nodes left on document.body
    for (const child of Array.from(document.body.children)) {
      if (child.id !== 'root-container') {
        child.remove()
      }
    }
  })

  it('FAILURE MODE 1: bare Portal inside an active LayerScope must reset layer scope so root portaled primitive emits data-layer', async () => {
    // Inside a container that has established LayerScopeContext = true and ColorModeContext = 'dark':
    await React.act(async () => {
      root.render(
        <LayerScopeContext.Provider value={true}>
          <ColorModeContext.Provider value="dark">
            <Portal>
              <Div id="bare-portal-primitive">Portaled content</Div>
            </Portal>
          </ColorModeContext.Provider>
        </LayerScopeContext.Provider>
      )
    })
    await React.act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    const portaledElement = document.getElementById('bare-portal-primitive')
    expect(portaledElement).not.toBeNull()

    // It is a direct child of document.body (teleported outside #root-container)
    expect(portaledElement?.parentElement).toBe(document.body)

    // It MUST emit data-layer because document.body is not inside the layer scope!
    // Without the fix, inheritsLayerScope=true crosses the portal, so data-layer is suppressed (null).
    expect(portaledElement?.getAttribute('data-layer')).toBeTruthy()
    // It should also inherit the dark color mode
    expect(portaledElement?.getAttribute('data-color-mode')).toBe('dark')
  })

  it('preserves layer scope for nested descendants inside a portal (no attribute bloat)', async () => {
    await React.act(async () => {
      root.render(
        <LayerScopeContext.Provider value={true}>
          <ColorModeContext.Provider value="dark">
            <Portal>
              <Div id="portal-root">
                <Div id="portal-nested">Nested child</Div>
              </Div>
            </Portal>
          </ColorModeContext.Provider>
        </LayerScopeContext.Provider>
      )
    })
    await React.act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    const portalRoot = document.getElementById('portal-root')
    const portalNested = document.getElementById('portal-nested')

    // Root portal element establishes the layer scope
    expect(portalRoot?.getAttribute('data-layer')).toBeTruthy()
    expect(portalRoot?.getAttribute('data-color-mode')).toBe('dark')

    // Nested child inherits scope, so data-layer is cleanly omitted (avoiding DOM bloat)
    expect(portalNested?.getAttribute('data-layer')).toBeNull()
    expect(portalNested?.getAttribute('data-color-mode')).toBe('dark')
  })

  it('PT-REACT-05 + PT-CONTAINER-06: switching containers replaces once; same-container rerenders preserve the subtree', async () => {
    const targetA = document.createElement('div')
    targetA.id = 'portal-unit-target-a'
    const targetB = document.createElement('div')
    targetB.id = 'portal-unit-target-b'
    document.body.appendChild(targetA)
    document.body.appendChild(targetB)

    let mounts = 0
    function StatefulChild() {
      const [count, setCount] = React.useState(0)
      React.useEffect(() => {
        mounts += 1
      }, [])
      return (
        <button
          type="button"
          id="portal-unit-stateful-child"
          data-count={count}
          onClick={() => setCount(c => c + 1)}
        >
          count
        </button>
      )
    }

    try {
      await React.act(async () => {
        root.render(
          <Portal container={targetA}>
            <StatefulChild />
          </Portal>
        )
      })
      // Settle the mount gate + container resolution effects.
      await React.act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      const before = document.getElementById('portal-unit-stateful-child')
      expect(before?.parentElement).toBe(targetA)
      expect(mounts).toBe(1)

      await React.act(async () => {
        before?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      expect(document.getElementById('portal-unit-stateful-child')?.getAttribute('data-count')).toBe(
        '1'
      )

      // Switch destination: the documented replacement drops child state.
      await React.act(async () => {
        root.render(
          <Portal container={targetB}>
            <StatefulChild />
          </Portal>
        )
      })
      await React.act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      const after = document.getElementById('portal-unit-stateful-child')
      expect(after?.parentElement).toBe(targetB)
      expect(targetA.querySelector('#portal-unit-stateful-child')).toBeNull()
      expect(mounts).toBe(2)
      expect(after?.getAttribute('data-count')).toBe('0')

      // Same-container rerenders preserve the mounted subtree (PT-CONTAINER-06).
      await React.act(async () => {
        after?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      await React.act(async () => {
        root.render(
          <Portal container={targetB}>
            <StatefulChild />
          </Portal>
        )
      })
      await React.act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })
      expect(mounts).toBe(2)
      expect(document.getElementById('portal-unit-stateful-child')?.getAttribute('data-count')).toBe(
        '1'
      )
    } finally {
      targetA.remove()
      targetB.remove()
    }
  })

  it('PT-CONTAINER-03: waits for a resolver function that initially returns null, with no transient body copy', async () => {
    const target = document.createElement('section')
    target.id = 'portal-unit-resolver-target'
    document.body.appendChild(target)

    let resolved: Element | null = null
    const resolver = () => resolved

    try {
      await React.act(async () => {
        root.render(
          <Portal container={resolver}>
            <div id="portal-unit-resolver-child">Resolver child</div>
          </Portal>
        )
      })
      await React.act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      // Unresolved: nothing in place, nothing in body.
      expect(document.getElementById('portal-unit-resolver-child')).toBeNull()
      expect(container.querySelector('#portal-unit-resolver-child')).toBeNull()

      // Resolve and rerender: exactly one copy in the returned element.
      resolved = target
      await React.act(async () => {
        root.render(
          <Portal container={resolver}>
            <div id="portal-unit-resolver-child">Resolver child</div>
          </Portal>
        )
      })
      await React.act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      const child = document.getElementById('portal-unit-resolver-child')
      expect(child?.parentElement).toBe(target)
      expect(document.body.querySelectorAll('#portal-unit-resolver-child').length).toBe(1)
    } finally {
      target.remove()
      document.getElementById('portal-unit-resolver-child')?.remove()
    }
  })

  it('PT-ENV-01: server render emits no portal child markup and touches no browser globals', () => {
    const html = renderToString(
      <div id="portal-ssr-host">
        <Portal>
          <div id="portal-ssr-child">Server child</div>
        </Portal>
      </div>
    )

    expect(html).toContain('portal-ssr-host')
    expect(html).not.toContain('portal-ssr-child')
  })

  it('PT-ENV-02: hydrates the server shell then attaches exactly one body child after the mount gate', async () => {
    const errors: string[] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    }
    try {
      const html = renderToString(
        <div id="portal-ssr-hydrate-host">
          <Portal>
            <div id="portal-ssr-hydrate-child">Hydrated child</div>
          </Portal>
        </div>
      )
      expect(html).not.toContain('portal-ssr-hydrate-child')

      const host = document.createElement('div')
      host.innerHTML = html
      document.body.appendChild(host)

      const hydrateRootHandle = hydrateRoot(
        host,
        <div id="portal-ssr-hydrate-host">
          <Portal>
            <div id="portal-ssr-hydrate-child">Hydrated child</div>
          </Portal>
        </div>
      )
      await React.act(async () => {
        await new Promise(r => setTimeout(r, 0))
      })

      // No in-place first-frame child: the mount gate portals to body.
      expect(host.querySelector('#portal-ssr-hydrate-child')).toBeNull()
      const child = document.getElementById('portal-ssr-hydrate-child')
      expect(child?.parentElement).toBe(document.body)

      await React.act(async () => {
        hydrateRootHandle.unmount()
      })
      host.remove()
      expect(errors.join('\n')).not.toMatch(/hydrat/i)
    } finally {
      console.error = origError
    }
  })

  it('FAILURE MODE 2: primitive reads DOM active theme from documentElement when React context is unset', async () => {
    // External theme toggle sets attribute directly on documentElement
    document.documentElement.setAttribute('data-color-mode', 'dark')

    await React.act(async () => {
      root.render(
        <Div id="standalone-primitive">Standalone</Div>
      )
    })
    await React.act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    const element = document.getElementById('standalone-primitive')
    expect(element).not.toBeNull()

    // Without DOM theme reading, React ColorModeContext is undefined so theme attribute is null.
    // It MUST read 'dark' from document.documentElement!
    expect(element?.getAttribute('data-color-mode')).toBe('dark')
  })
})
