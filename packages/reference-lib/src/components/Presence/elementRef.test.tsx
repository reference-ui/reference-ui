// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { Presence } from './Presence'
import { getElementRef } from './elementRef'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

function refWarningCalls(errorSpy: { mock: { calls: unknown[][] } }): unknown[][] {
  return errorSpy.mock.calls.filter(args =>
    args.some(arg => typeof arg === 'string' && /element\.ref|ref was removed/i.test(arg))
  )
}

describe('PR-REF-05: element ref reads stay silent on every React major', () => {
  it('never invokes a ref accessor, even when the element only exposes one', () => {
    let invocations = 0
    const element = {
      props: {},
      get ref() {
        invocations++
        return undefined
      },
    }

    expect(getElementRef(element as unknown as React.ReactElement)).toBeUndefined()
    expect(invocations).toBe(0)
  })

  it('prefers a props ref value without touching an element ref accessor', () => {
    let invocations = 0
    const consumerRef = { current: null }
    const element = {
      props: { ref: consumerRef },
      get ref() {
        invocations++
        return undefined
      },
    }

    expect(getElementRef(element as unknown as React.ReactElement)).toBe(consumerRef)
    expect(invocations).toBe(0)
  })

  it('reads a plain element ref value when props carry no ref', () => {
    const consumerRef = { current: null }
    const element = { props: {}, ref: consumerRef }

    expect(getElementRef(element as unknown as React.ReactElement)).toBe(consumerRef)
  })

  it('reads the element ref when props carry only a warning getter', () => {
    const consumerRef = { current: null }
    const props: Record<string, unknown> = {}
    const warn = () => consumerRef
    ;(warn as unknown as Record<string, unknown>).isReactWarning = true
    Object.defineProperty(props, 'ref', { get: warn, configurable: true })
    const element = { props, ref: consumerRef }

    expect(getElementRef(element as unknown as React.ReactElement)).toBe(consumerRef)
  })

  it('reads real React elements with and without refs and logs no ref warning', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const consumerRef = React.createRef<HTMLDivElement>()
      expect(getElementRef(<div ref={consumerRef}>with ref</div>)).toBe(consumerRef)
      // No-ref reads are nullish on every major (null data on 19.2+, undefined
      // where element.ref is a skipped-over accessor) — never a warning.
      expect(getElementRef(<div>without ref</div>) == null).toBe(true)
      expect(refWarningCalls(errorSpy)).toEqual([])
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('server-renders ref-less children without a ref warning', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const markup = renderToString(
        <Presence present={true}>
          <div id="ssr-no-ref">SSR Content</div>
        </Presence>
      )
      expect(markup).toContain('id="ssr-no-ref"')
      expect(refWarningCalls(errorSpy)).toEqual([])
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('mounts ref-less and ref-ful children without a ref warning', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const consumerRef = React.createRef<HTMLDivElement>()
    try {
      await React.act(async () => {
        root.render(
          <>
            <Presence present={true}>
              <div data-testid="no-ref">plain</div>
            </Presence>
            <Presence present={true}>
              <div data-testid="with-ref" ref={consumerRef}>
                ref
              </div>
            </Presence>
          </>
        )
      })

      expect(consumerRef.current?.dataset.testid).toBe('with-ref')
      expect(refWarningCalls(errorSpy)).toEqual([])
    } finally {
      await React.act(async () => {
        root.unmount()
      })
      container.remove()
      errorSpy.mockRestore()
    }
  })
})
