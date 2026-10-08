// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { Popover } from './Popover'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Popover override seam', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('PO-SEAM-01: Trigger defaults aria-haspopup to dialog', async () => {
    await React.act(async () => {
      root.render(
        <Popover>
          <Popover.Trigger id="seam-trigger">Open</Popover.Trigger>
          <Popover.Content>Body</Popover.Content>
        </Popover>
      )
    })
    expect(document.getElementById('seam-trigger')?.getAttribute('aria-haspopup')).toBe('dialog')
  })

  it('PO-SEAM-02: Trigger honors consumer aria-haspopup override', async () => {
    await React.act(async () => {
      root.render(
        <Popover>
          <Popover.Trigger id="seam-trigger" aria-haspopup="menu">
            Open
          </Popover.Trigger>
          <Popover.Content>Body</Popover.Content>
        </Popover>
      )
    })
    expect(document.getElementById('seam-trigger')?.getAttribute('aria-haspopup')).toBe('menu')
  })

  it('PO-SEAM-03: Content defaults role to dialog', async () => {
    await React.act(async () => {
      root.render(
        <Popover defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content>Body</Popover.Content>
        </Popover>
      )
    })
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('PO-SEAM-04: Content honors consumer role override', async () => {
    await React.act(async () => {
      root.render(
        <Popover defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content role="menu">Body</Popover.Content>
        </Popover>
      )
    })
    const content = document.body.querySelector('[role="menu"]')
    expect(content).not.toBeNull()
    expect(content?.textContent).toBe('Body')
  })
})
