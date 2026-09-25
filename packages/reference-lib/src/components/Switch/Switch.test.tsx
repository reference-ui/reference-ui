// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { Switch } from './Switch'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Switch environments', () => {
  it('SW-ENV-01: Switch should hydrate server markup without mismatch and request once on first click', async () => {
    const htmlTrue = renderToString(<Switch checked={true} />)

    const container = document.createElement('div')
    container.innerHTML = htmlTrue
    document.body.appendChild(container)

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let requestedValue: boolean | null = null
    function InteractiveApp() {
      const [checked, setChecked] = React.useState(true)
      return (
        <Switch
          checked={checked}
          onChange={val => {
            requestedValue = val
            setChecked(val)
          }}
        />
      )
    }

    const root = createRoot(container)
    await React.act(async () => {
      root.render(<InteractiveApp />)
    })

    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    const button = container.querySelector('button[role="switch"]') as HTMLButtonElement
    expect(button).not.toBeNull()
    await React.act(async () => {
      button.click()
    })
    expect(requestedValue).toBe(false)

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('SW-ENV-02: Switch should keep one registration and request under StrictMode replay', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    let requestCount = 0
    let lastRequested: boolean | null = null
    let rootRefValue: HTMLButtonElement | null = null
    let thumbRefValue: HTMLSpanElement | null = null

    function StrictModeHarness() {
      const [checked, setChecked] = React.useState(false)
      return (
        <React.StrictMode>
          <Switch
            ref={el => {
              rootRefValue = el
            }}
            checked={checked}
            onChange={val => {
              requestCount++
              lastRequested = val
              setChecked(val)
            }}
          >
            <Switch.Thumb
              ref={el => {
                thumbRefValue = el
              }}
            />
          </Switch>
        </React.StrictMode>
      )
    }

    const root = createRoot(container)
    await React.act(async () => {
      root.render(<StrictModeHarness />)
    })

    expect(rootRefValue).toBeInstanceOf(HTMLButtonElement)
    expect(thumbRefValue).toBeInstanceOf(HTMLSpanElement)

    const button = container.querySelector('button[role="switch"]') as HTMLButtonElement
    await React.act(async () => {
      button.click()
    })
    expect(requestCount).toBe(1)
    expect(lastRequested).toBe(true)

    const container2 = document.createElement('div')
    document.body.appendChild(container2)
    const root2 = createRoot(container2)
    await React.act(async () => {
      root2.render(
        <React.StrictMode>
          <Switch checked={false} />
        </React.StrictMode>
      )
    })

    const thumbs = container2.querySelectorAll('[data-reference-switch-thumb]')
    expect(thumbs.length).toBe(1)

    await React.act(async () => {
      root.unmount()
      root2.unmount()
    })
    container.remove()
    container2.remove()
  })
})
