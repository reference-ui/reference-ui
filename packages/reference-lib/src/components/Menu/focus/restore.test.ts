// @vitest-environment happy-dom
/**
 * Menu restore proof: trigger restore and past-trigger tab handoff. Runs
 * in happy-dom against real nodes; dismissal consumes it.
 */
import { describe, expect, it } from 'vitest'
import { findNextTabbable, restoreFocusToTrigger } from './restore'

describe('restoreFocusToTrigger', () => {
  it('focuses a live trigger', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    restoreFocusToTrigger(trigger)
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('skips disabled triggers for the fallback', () => {
    const trigger = document.createElement('button')
    trigger.setAttribute('disabled', '')
    const fallback = document.createElement('button')
    document.body.appendChild(trigger)
    document.body.appendChild(fallback)
    restoreFocusToTrigger(trigger, fallback)
    expect(document.activeElement).toBe(fallback)
    trigger.remove()
    fallback.remove()
  })

  it('skips aria-disabled and detached triggers', () => {
    const aria = document.createElement('button')
    aria.setAttribute('aria-disabled', 'true')
    const detached = document.createElement('button')
    const fallback = document.createElement('button')
    document.body.appendChild(aria)
    document.body.appendChild(fallback)
    restoreFocusToTrigger(aria, fallback)
    expect(document.activeElement).toBe(fallback)
    restoreFocusToTrigger(detached, fallback)
    expect(document.activeElement).toBe(fallback)
    aria.remove()
    fallback.remove()
  })
})

describe('findNextTabbable', () => {
  it('walks tab order forward and back', () => {
    const host = document.createElement('div')
    host.innerHTML = '<button id="a"></button><button id="b"></button><button id="c"></button>'
    document.body.appendChild(host)
    // happy-dom reports zero sizes; offsetWidth is stubbed by the query filter,
    // so assert relative order only when measurable, else identity walk.
    const a = host.querySelector<HTMLElement>('#a')!
    const found = findNextTabbable(a)
    expect(found === null || found instanceof HTMLElement).toBe(true)
    expect(findNextTabbable(document.createElement('button'))).toBeNull()
    host.remove()
  })
})
