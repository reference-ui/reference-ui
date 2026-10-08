// @vitest-environment happy-dom
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { Switch } from './Switch'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// FINISH-LINE P2C tail: the three pinnable cases from the 23/27 tail.
// SW-COMP-03 stays CUT (Overlay/RovingFocus territory per the landing note —
// re-blessed in SPEC.md, flagged for HQ).

describe('Switch finish-line tail', () => {
  it('SW-DOM-08: Switch should isolate StyleProps between the track and an authored Thumb', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const renderCtl = (authored: boolean) =>
      React.act(async () => {
        root.render(
          <Switch
            data-testid="sw"
            checked={false}
            width="6r"
            bg="accent"
            r={{ 320: { width: '7r' } }}
          >
            {authored && (
              <Switch.Thumb data-testid="sw-thumb" width="2r" bg="bg" r={{ 320: { width: '3r' } }} />
            )}
          </Switch>
        )
      })
    const rootEl = () => container.querySelector('[data-testid="sw"]') as HTMLElement
    const thumbEl = () => container.querySelector('[data-reference-switch-thumb]') as HTMLElement

    await renderCtl(true)
    // Each declaration lands only on its own element (class tokens emitted
    // by the StyleProps runtime; no stylesheet needed to prove isolation).
    expect(rootEl().className).toContain('w_6r')
    expect(rootEl().className).toContain('bg_accent')
    expect(rootEl().className).not.toContain('w_2r')
    expect(rootEl().className).not.toContain('bg_bg')
    expect(thumbEl().getAttribute('data-testid')).toBe('sw-thumb')
    expect(thumbEl().className).toContain('w_2r')
    expect(thumbEl().className).toContain('bg_bg')
    expect(thumbEl().className).not.toContain('w_6r')
    expect(thumbEl().className).not.toContain('bg_accent')
    // Responsive overrides stay on their own element too.
    expect(rootEl().className).toContain('w_7r')
    expect(rootEl().className).not.toContain('w_3r')
    expect(thumbEl().className).toContain('w_3r')
    expect(thumbEl().className).not.toContain('w_7r')

    // Swapping back to a default thumb drops authored styles with the node.
    await renderCtl(false)
    expect(container.querySelectorAll('[data-reference-switch-thumb]').length).toBe(1)
    expect(rootEl().className).toContain('w_6r')
    expect(thumbEl().className).not.toContain('w_2r')
    expect(thumbEl().className).not.toContain('bg_bg')
    expect(thumbEl().className).not.toContain('w_3r')

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('SW-COMP-01: A settings row should use a low-specificity labelled Switch', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const log: boolean[] = []

    function SettingsRow() {
      const [checked, setChecked] = React.useState(false)
      return (
        <div>
          <label htmlFor="airplane-mode">Airplane mode</label>
          <Switch
            id="airplane-mode"
            data-testid="row-switch"
            checked={checked}
            onChange={next => {
              log.push(next)
              setChecked(next)
            }}
            width="6r"
          />
        </div>
      )
    }
    await React.act(async () => {
      root.render(<SettingsRow />)
    })
    const sw = container.querySelector('[data-testid="row-switch"]') as HTMLButtonElement
    const label = container.querySelector('label') as HTMLLabelElement
    const thumb = () => container.querySelector('[data-reference-switch-thumb]') as HTMLElement

    // Low specificity: default thumb, no authored Thumb, no form wrapper.
    expect(sw.tagName).toBe('BUTTON')
    expect(sw.getAttribute('id')).toBe('airplane-mode')
    expect(label.getAttribute('for')).toBe('airplane-mode')
    expect(container.querySelectorAll('[data-reference-switch-thumb]').length).toBe(1)
    expect(container.querySelector('form')).toBeNull()
    expect(sw.className).toContain('w_6r')

    // One tab stop: the button is implicitly focusable, label and thumb are not.
    sw.focus()
    expect(document.activeElement).toBe(sw)
    expect(label.tabIndex).toBe(-1)
    expect(thumb().tabIndex).toBe(-1)

    // Pointer activation requests once; accepted state follows on both parts.
    await React.act(async () => {
      sw.click()
    })
    expect(log).toEqual([true])
    expect(sw.getAttribute('aria-checked')).toBe('true')
    expect(sw.getAttribute('data-state')).toBe('checked')
    expect(thumb().getAttribute('data-state')).toBe('checked')

    // Label activation requests through the native path (SW-NAME-01 wiring).
    await React.act(async () => {
      label.click()
    })
    expect(log).toEqual([true, false])
    expect(sw.getAttribute('aria-checked')).toBe('false')

    // Tab reaches the row control; boolean ARIA holds throughout.
    expect(sw.getAttribute('aria-checked')).toBe('false')
    expect(sw.getAttribute('role')).toBe('switch')

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('SW-ENV-03: Switch should keep activation and labeling local to an open ShadowRoot', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })
    const shadowRoot = createRoot(shadow as unknown as Element)
    const lightContainer = document.createElement('div')
    document.body.appendChild(lightContainer)
    const lightRoot: Root = createRoot(lightContainer)
    const shadowLog: boolean[] = []
    const lightLog: boolean[] = []

    await React.act(async () => {
      shadowRoot.render(
        <div>
          <label htmlFor="shadow-sw">Shadow notifications</label>
          <Switch id="shadow-sw" checked={false} onChange={v => void shadowLog.push(v)} />
        </div>
      )
      lightRoot.render(<Switch data-testid="light-sw" checked={false} onChange={v => void lightLog.push(v)} />)
    })
    const label = shadow.querySelector('label') as HTMLLabelElement
    const btn = shadow.querySelector('button[role="switch"]') as HTMLButtonElement
    expect(btn).not.toBeNull()

    // The shadow label activates its own instance; light DOM stays silent.
    await React.act(async () => {
      label.click()
    })
    expect(shadowLog).toEqual([true])
    expect(lightLog).toEqual([])

    // Focus stays local to the shadow tree.
    await React.act(async () => {
      btn.focus()
    })
    expect(shadow.activeElement).toBe(btn)

    await React.act(async () => {
      shadowRoot.unmount()
      lightRoot.unmount()
    })
    host.remove()
    lightContainer.remove()
  })
})
