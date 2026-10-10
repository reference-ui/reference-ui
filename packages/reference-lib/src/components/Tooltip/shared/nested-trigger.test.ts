/** Isolation proof for isNestedTooltipTrigger: only inner-trigger targets nest. */
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import type * as React from 'react'
import { isNestedTooltipTrigger } from './nested-trigger'

function trigger(): HTMLElement {
  const el = document.createElement('button')
  el.setAttribute('data-reference-tooltip-trigger', '')
  return el
}

function event(target: EventTarget | null, currentTarget: EventTarget): React.SyntheticEvent<HTMLElement> {
  return { target, currentTarget } as React.SyntheticEvent<HTMLElement>
}

describe('nested tooltip trigger', () => {
  it('ignores non-element targets', () => {
    expect(isNestedTooltipTrigger(event(null, trigger()))).toBe(false)
  })

  it('treats the owning trigger itself as not nested', () => {
    const own = trigger()
    expect(isNestedTooltipTrigger(event(own, own))).toBe(false)
  })

  it('treats an inner trigger target as nested', () => {
    const outer = trigger()
    const inner = trigger()
    outer.appendChild(inner)
    expect(isNestedTooltipTrigger(event(inner, outer))).toBe(true)
  })

  it('treats plain content inside the owning trigger as not nested', () => {
    const own = trigger()
    const label = document.createElement('span')
    own.appendChild(label)
    expect(isNestedTooltipTrigger(event(label, own))).toBe(false)
  })
})
