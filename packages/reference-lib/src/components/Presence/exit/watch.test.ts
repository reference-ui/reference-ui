// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { watchExitCompletion } from './watch'

/**
 * Unit proof for `exit/watch`: end/cancel events targeted at the observed
 * node signal completion; descendant events and post-cleanup events stay
 * silent (PR-TRANSITION-04, PR-ANIMATION-06, PR-RACE-05).
 */

describe('watchExitCompletion', () => {
  it('signals on end and cancel events targeted at the node', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onSignal = vi.fn()
    const stop = watchExitCompletion(el, onSignal)
    try {
      el.dispatchEvent(new Event('transitionend', { bubbles: true }))
      expect(onSignal).toHaveBeenCalledTimes(1)
      el.dispatchEvent(new Event('animationend', { bubbles: true }))
      expect(onSignal).toHaveBeenCalledTimes(2)
      el.dispatchEvent(new Event('transitioncancel', { bubbles: true }))
      el.dispatchEvent(new Event('animationcancel', { bubbles: true }))
      expect(onSignal).toHaveBeenCalledTimes(4)
    } finally {
      stop()
      el.remove()
    }
  })

  it('ignores descendant events bubbling through the node', () => {
    const el = document.createElement('div')
    const child = document.createElement('span')
    el.appendChild(child)
    document.body.appendChild(el)
    const onSignal = vi.fn()
    const stop = watchExitCompletion(el, onSignal)
    try {
      child.dispatchEvent(new Event('transitionend', { bubbles: true }))
      child.dispatchEvent(new Event('animationend', { bubbles: true }))
      expect(onSignal).not.toHaveBeenCalled()
    } finally {
      stop()
      el.remove()
    }
  })

  it('stays silent after cleanup', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onSignal = vi.fn()
    const stop = watchExitCompletion(el, onSignal)
    stop()
    el.dispatchEvent(new Event('transitionend', { bubbles: true }))
    el.dispatchEvent(new Event('animationend', { bubbles: true }))
    expect(onSignal).not.toHaveBeenCalled()
    el.remove()
  })
})
