// @vitest-environment happy-dom
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { Collapsible } from './Collapsible'
import { finiteGsapTweens } from '../../motion/gsap'

async function mount(node: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await React.act(async () => {
    root.render(node)
  })
  return {
    container,
    unmount: async () => {
      await React.act(async () => {
        root.unmount()
      })
      container.remove()
    },
    rerender: async (next: React.ReactElement) => {
      await React.act(async () => {
        root.render(next)
      })
    },
  }
}

function panel(container: HTMLElement): HTMLElement {
  const node = container.querySelector('[data-testid="content"]')
  if (!node || !(node instanceof HTMLElement)) throw new Error('content panel missing')
  return node
}

describe('Collapsible Mount Contract (CO-MOUNT)', () => {
  it('CO-MOUNT-01: closed hidden-until-found content stays mounted, hidden, inert, and linked', async () => {
    const { container, unmount } = await mount(
      <Collapsible>
        <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" hiddenUntilFound>
          secret
        </Collapsible.Content>
      </Collapsible>
    )

    const content = panel(container)
    const trigger = container.querySelector('[data-testid="trigger"]')!
    expect(content.getAttribute('hidden')).toBe('until-found')
    expect(content.hasAttribute('inert')).toBe(true)
    expect(content.getAttribute('aria-hidden')).toBe('true')
    expect(content.getAttribute('data-state')).toBe('closed')
    expect(trigger.getAttribute('aria-controls')).toBe(content.getAttribute('id'))

    await unmount()
  })

  it('CO-MOUNT-02: root hiddenUntilFound is inherited; Content false overrides root true', async () => {
    const inherited = await mount(
      <Collapsible hiddenUntilFound>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content">secret</Collapsible.Content>
      </Collapsible>
    )
    expect(panel(inherited.container).getAttribute('hidden')).toBe('until-found')
    await inherited.unmount()

    const overridden = await mount(
      <Collapsible hiddenUntilFound>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" hiddenUntilFound={false}>
          secret
        </Collapsible.Content>
      </Collapsible>
    )
    expect(overridden.container.querySelector('[data-testid="content"]')).toBeNull()
    await overridden.unmount()
  })

  it('CO-MOUNT-03: hidden-until-found close shuts instantly with no tween and upgrades hidden', async () => {
    const { container, unmount } = await mount(
      <Collapsible defaultOpen>
        <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" hiddenUntilFound>
          secret
        </Collapsible.Content>
      </Collapsible>
    )
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLElement

    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const content = panel(container)
    expect(content.getAttribute('hidden')).toBe('until-found')
    expect(content.style.height).toBe('0px')
    expect(finiteGsapTweens(content)).toHaveLength(0)

    await unmount()
  })

  it('CO-MOUNT-04: beforematch on closed hidden-until-found content opens instantly with no enter motion', async () => {
    const seen: boolean[] = []
    const { container, unmount } = await mount(
      <Collapsible onChange={(open) => seen.push(open)}>
        <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" hiddenUntilFound>
          findme
        </Collapsible.Content>
      </Collapsible>
    )

    const content = panel(container)
    await React.act(async () => {
      content.dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })

    expect(seen).toEqual([true])
    expect(content.hasAttribute('hidden')).toBe(false)
    expect(content.getAttribute('data-state')).toBe('open')
    expect(content.style.height).toBe('auto')
    expect(finiteGsapTweens(content)).toHaveLength(0)

    await unmount()
  })

  it('CO-MOUNT-05: cancelled beforematch stays closed; the next trigger open still animates', async () => {
    const seen: boolean[] = []
    const { container, unmount } = await mount(
      <Collapsible onChange={(open) => seen.push(open)}>
        <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" hiddenUntilFound>
          findme
        </Collapsible.Content>
      </Collapsible>
    )

    const content = panel(container)
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLElement
    const cancel = (event: Event) => event.preventDefault()
    content.addEventListener('beforematch', cancel)

    await React.act(async () => {
      content.dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })
    expect(seen).toEqual([])
    expect(content.getAttribute('data-state')).toBe('closed')
    content.removeEventListener('beforematch', cancel)

    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(seen).toEqual([true])
    expect(finiteGsapTweens(panel(container)).length).toBeGreaterThan(0)

    await unmount()
  })

  it('CO-MOUNT-06: forceMount closed content stays mounted, visible, and interactive with focus kept', async () => {
    const { container, unmount } = await mount(
      <Collapsible defaultOpen>
        <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" forceMount>
          <input data-testid="field" />
        </Collapsible.Content>
      </Collapsible>
    )

    const field = container.querySelector('[data-testid="field"]') as HTMLInputElement
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLElement
    await React.act(async () => {
      field.focus()
    })
    expect(document.activeElement).toBe(field)

    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const content = panel(container)
    expect(content.hasAttribute('hidden')).toBe(false)
    expect(content.hasAttribute('inert')).toBe(false)
    expect(content.hasAttribute('aria-hidden')).toBe(false)
    expect(content.style.pointerEvents).not.toBe('none')
    expect(content.style.height).toBe('')
    expect(document.activeElement).toBe(field)

    await unmount()
  })

  it('CO-MOUNT-07: hiddenUntilFound wins over forceMount', async () => {
    const { container, unmount } = await mount(
      <Collapsible>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" hiddenUntilFound forceMount>
          secret
        </Collapsible.Content>
      </Collapsible>
    )

    const content = panel(container)
    expect(content.getAttribute('hidden')).toBe('until-found')
    expect(content.hasAttribute('inert')).toBe(true)

    await unmount()
  })

  it('CO-MOUNT-08: a rejected beforematch arms the skip consumed by the next committed open', async () => {
    const seen: boolean[] = []
    const render = (open: boolean) => (
      <Collapsible open={open} onChange={(next) => seen.push(next)}>
        <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" hiddenUntilFound>
          findme
        </Collapsible.Content>
      </Collapsible>
    )
    const { container, rerender, unmount } = await mount(render(false))

    await React.act(async () => {
      panel(container).dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })
    expect(seen).toEqual([true])
    expect(panel(container).getAttribute('data-state')).toBe('closed')

    await rerender(render(true))
    expect(finiteGsapTweens(panel(container))).toHaveLength(0)

    await unmount()
  })

  it('CO-MOUNT-09: default close still evacuates focus from exiting content (no forceMount)', async () => {
    const { container, unmount } = await mount(
      <Collapsible defaultOpen>
        <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content">
          <input data-testid="field" />
        </Collapsible.Content>
      </Collapsible>
    )

    const field = container.querySelector('[data-testid="field"]') as HTMLInputElement
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLElement
    await React.act(async () => {
      field.focus()
    })
    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(document.activeElement).toBe(trigger)

    await unmount()
  })

  it('CO-MOUNT-10: beforematch while open is a no-op', async () => {
    const seen: boolean[] = []
    const { container, unmount } = await mount(
      <Collapsible defaultOpen onChange={(open) => seen.push(open)}>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content" hiddenUntilFound>
          findme
        </Collapsible.Content>
      </Collapsible>
    )

    await React.act(async () => {
      panel(container).dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })
    expect(seen).toEqual([])
    expect(panel(container).getAttribute('data-state')).toBe('open')

    await unmount()
  })
})
