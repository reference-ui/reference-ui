// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Overlay } from '../../../../packages/reference-lib/src/components/Overlay/Overlay'

describe('Overlay SSR (OV-ENV-01 / OV-ENV-02 / OV-POS-11)', () => {
  it('OV-ENV-01: closed Overlay server-renders without a portal payload', () => {
    const html = renderToString(
      <Overlay open={false}>
        <Overlay.Trigger>Open</Overlay.Trigger>
        <Overlay.Content role="dialog">Secret</Overlay.Content>
      </Overlay>
    )
    expect(html).toContain('Open')
    expect(html).not.toContain('Secret')
    expect(html).not.toContain('role="dialog"')
  })

  it('OV-ENV-02: initially open Overlay still defers portal activation on the server', () => {
    const html = renderToString(
      <Overlay open>
        <Overlay.Trigger>Open</Overlay.Trigger>
        <Overlay.Backdrop />
        <Overlay.Content role="dialog" aria-labelledby="ssr-title">
          <h2 id="ssr-title">Server open</h2>
        </Overlay.Content>
      </Overlay>
    )
    expect(html).toContain('Open')
    expect(html).not.toContain('Server open')
    expect(html).not.toContain('ssr-title')
  })

  it('OV-POS-11: anchored open Overlay skips geometry during SSR', () => {
    const html = renderToString(
      <Overlay open anchor={{ x: 24, y: 48 }} isolation={false}>
        <Overlay.Content placement="bottom-start">Anchored</Overlay.Content>
      </Overlay>
    )
    expect(html).not.toContain('Anchored')
    expect(html).not.toContain('position:absolute')
    expect(html).not.toContain('--reference-overlay')
  })
})
