// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import type { PortalProps } from '../../Portal'
import type { OverlayContextValue } from '../context'
import { resolvePortalContainer } from './portal-container'

function contextWith({
  portalContainer,
  trigger,
}: {
  portalContainer?: PortalProps['container']
  trigger?: HTMLElement | null
}): OverlayContextValue {
  return {
    portalContainer,
    triggerRef: { current: trigger ?? null },
  } as OverlayContextValue
}

describe('resolvePortalContainer (shadow destination rule)', () => {
  it('lets an explicit container win, including null (Portal default-to-body)', () => {
    const explicit = document.createElement('div')
    const shadowTrigger = document.createElement('button')
    expect(
      resolvePortalContainer(contextWith({ portalContainer: explicit, trigger: shadowTrigger }))
    ).toBe(explicit)
    expect(
      resolvePortalContainer(contextWith({ portalContainer: null, trigger: shadowTrigger }))
    ).toBe(null)
  })

  it('returns undefined without a trigger, so Portal falls back to body', () => {
    expect(resolvePortalContainer(contextWith({}))).toBe(undefined)
    expect(resolvePortalContainer(contextWith({ trigger: null }))).toBe(undefined)
  })

  it('returns undefined for a light-DOM trigger', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    try {
      expect(resolvePortalContainer(contextWith({ trigger }))).toBe(undefined)
    } finally {
      trigger.remove()
    }
  })

  it('returns the ShadowRoot for a trigger living in one', () => {
    if (typeof (document.createElement('div') as HTMLElement).attachShadow !== 'function') {
      return
    }
    const host = document.createElement('div')
    document.body.appendChild(host)
    try {
      const root = host.attachShadow({ mode: 'open' })
      const trigger = document.createElement('button')
      root.appendChild(trigger)
      expect(resolvePortalContainer(contextWith({ trigger }))).toBe(root)
    } finally {
      host.remove()
    }
  })
})
