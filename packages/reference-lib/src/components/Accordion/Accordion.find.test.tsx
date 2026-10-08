// @vitest-environment happy-dom
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
import * as React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { Accordion } from './Accordion'
import { Collapsible } from '../Collapsible'
import { finiteGsapTweens } from '../../motion/gsap'

async function mount(node: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(node)
  })
  return {
    container,
    unmount: async () => {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}

function byTestId(container: HTMLElement, id: string): HTMLElement {
  const node = container.querySelector(`[data-testid="${id}"]`)
  if (!node || !(node instanceof HTMLElement)) throw new Error(`missing ${id}`)
  return node
}

function dispatchBeforeMatch(node: HTMLElement) {
  return act(async () => {
    node.dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
  })
}

describe('Accordion Find Contract (AC-FIND)', () => {
  it('AC-FIND-01: single-mode beforematch swaps the open item with enter motion skipped', async () => {
    const seen: unknown[] = []
    const { container, unmount } = await mount(
      <Accordion expansion="single" value="a" onChange={(v) => seen.push(v)}>
        <Accordion.Item id="a">
          <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
        </Accordion.Item>
        <Accordion.Item id="b" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-b">findable Panel B</Collapsible.Content>
        </Accordion.Item>
      </Accordion>
    )

    const contentB = byTestId(container, 'content-b')
    expect(contentB.getAttribute('hidden')).toBe('until-found')

    await dispatchBeforeMatch(contentB)

    expect(seen).toEqual(['b'])
    // Controlled parent held value="a": the request fired; commit the swap.
    expect(byTestId(container, 'trigger-a').getAttribute('aria-expanded')).toBe('true')
    await unmount()
  })

  it('AC-FIND-02: single-mode beforematch swap commits through self-managed value', async () => {
    const { container, unmount } = await mount(
      <Accordion expansion="single">
        <Accordion.Item id="a" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-a">findable Panel A</Collapsible.Content>
        </Accordion.Item>
        <Accordion.Item id="b" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-b">findable Panel B</Collapsible.Content>
        </Accordion.Item>
      </Accordion>
    )

    // Open A via trigger, then find-match inside closed B.
    await act(async () => {
      byTestId(container, 'trigger-a').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(byTestId(container, 'trigger-a').getAttribute('aria-expanded')).toBe('true')

    const contentB = byTestId(container, 'content-b')
    await dispatchBeforeMatch(contentB)

    expect(byTestId(container, 'trigger-b').getAttribute('aria-expanded')).toBe('true')
    expect(byTestId(container, 'trigger-a').getAttribute('aria-expanded')).toBe('false')
    expect(contentB.hasAttribute('hidden')).toBe(false)
    expect(finiteGsapTweens(contentB)).toHaveLength(0)
    // The swapped-out item stays mounted-hidden (untilFound), not unmounted.
    const contentA = byTestId(container, 'content-a')
    expect(contentA.getAttribute('hidden')).toBe('until-found')

    await unmount()
  })

  it('AC-FIND-03: multiple-mode beforematch adds the item without closing others', async () => {
    const { container, unmount } = await mount(
      <Accordion expansion="multiple">
        <Accordion.Item id="a" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-a">findable Panel A</Collapsible.Content>
        </Accordion.Item>
        <Accordion.Item id="b" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-b">findable Panel B</Collapsible.Content>
        </Accordion.Item>
      </Accordion>
    )

    await act(async () => {
      byTestId(container, 'trigger-a').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await dispatchBeforeMatch(byTestId(container, 'content-b'))

    expect(byTestId(container, 'trigger-a').getAttribute('aria-expanded')).toBe('true')
    expect(byTestId(container, 'trigger-b').getAttribute('aria-expanded')).toBe('true')

    await unmount()
  })

  it('AC-FIND-04: cancelled beforematch does not swap; beforematch on the open item is a no-op', async () => {
    const seen: unknown[] = []
    const { container, unmount } = await mount(
      <Accordion expansion="single" onChange={(v) => seen.push(v)}>
        <Accordion.Item id="a" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-a">findable Panel A</Collapsible.Content>
        </Accordion.Item>
        <Accordion.Item id="b" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-b">findable Panel B</Collapsible.Content>
        </Accordion.Item>
      </Accordion>
    )

    const contentB = byTestId(container, 'content-b')
    const cancel = (event: Event) => event.preventDefault()
    contentB.addEventListener('beforematch', cancel)
    await dispatchBeforeMatch(contentB)
    contentB.removeEventListener('beforematch', cancel)
    expect(seen).toEqual([])
    expect(byTestId(container, 'trigger-b').getAttribute('aria-expanded')).toBe('false')

    // Open B, then beforematch on the OPEN panel: no toggle-off.
    await act(async () => {
      byTestId(container, 'trigger-b').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(seen).toEqual(['b'])
    await dispatchBeforeMatch(byTestId(container, 'content-b'))
    expect(seen).toEqual(['b'])
    expect(byTestId(container, 'trigger-b').getAttribute('aria-expanded')).toBe('true')

    await unmount()
  })

  it('AC-FIND-05: beforematch inside a nested standalone Collapsible opens only the inner disclosure', async () => {
    const seen: unknown[] = []
    const { container, unmount } = await mount(
      <Accordion expansion="single" onChange={(v) => seen.push(v)}>
        <Accordion.Item id="a" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-a">
            <Collapsible>
              <Collapsible.Trigger data-testid="inner-trigger">Inner</Collapsible.Trigger>
              <Collapsible.Content data-testid="inner-content" hiddenUntilFound>
                findable inner secret
              </Collapsible.Content>
            </Collapsible>
          </Collapsible.Content>
        </Accordion.Item>
      </Accordion>
    )

    await act(async () => {
      byTestId(container, 'trigger-a').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(seen).toEqual(['a'])

    const inner = byTestId(container, 'inner-content')
    expect(inner.getAttribute('hidden')).toBe('until-found')
    await dispatchBeforeMatch(inner)

    // Inner opened standalone; the Accordion heard nothing new.
    expect(seen).toEqual(['a'])
    expect(inner.getAttribute('data-state')).toBe('open')
    expect(byTestId(container, 'trigger-a').getAttribute('aria-expanded')).toBe('true')

    await unmount()
  })

  it('AC-FIND-06: raw Collapsible id items inherit hiddenUntilFound from the root prop', async () => {
    const { container, unmount } = await mount(
      <Accordion expansion="single">
        <Collapsible id="a" hiddenUntilFound>
          <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-a">findable Panel A</Collapsible.Content>
        </Collapsible>
      </Accordion>
    )

    expect(byTestId(container, 'content-a').getAttribute('hidden')).toBe('until-found')
    await unmount()
  })
})
