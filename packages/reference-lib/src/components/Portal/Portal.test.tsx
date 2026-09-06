// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
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
    document.documentElement.removeAttribute('data-panda-theme')
    document.body.removeAttribute('data-panda-theme')
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
    expect(portaledElement?.getAttribute('data-panda-theme')).toBe('dark')
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
    expect(portalRoot?.getAttribute('data-panda-theme')).toBe('dark')

    // Nested child inherits scope, so data-layer is cleanly omitted (avoiding DOM bloat)
    expect(portalNested?.getAttribute('data-layer')).toBeNull()
    expect(portalNested?.getAttribute('data-panda-theme')).toBe('dark')
  })

  it('FAILURE MODE 2: primitive reads DOM active theme from documentElement when React context is unset', async () => {
    // External theme toggle sets attribute directly on documentElement
    document.documentElement.setAttribute('data-panda-theme', 'dark')

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
    expect(element?.getAttribute('data-panda-theme')).toBe('dark')
  })
})
