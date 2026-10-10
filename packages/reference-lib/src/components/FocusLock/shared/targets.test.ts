// @vitest-environment happy-dom
/** Isolation proof for target resolution: FocusTarget forms and shard filtering. */
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { resolveFocusTarget, resolveShardElements } from './targets'

describe('resolveFocusTarget', () => {
  it('resolves elements, refs, and resolvers', () => {
    const el = document.createElement('button')
    expect(resolveFocusTarget(el)).toBe(el)
    expect(resolveFocusTarget(() => el)).toBe(el)
    const ref = React.createRef<HTMLElement>()
    ;(ref as React.MutableRefObject<HTMLElement | null>).current = el
    expect(resolveFocusTarget(ref)).toBe(el)
  })

  it('collapses empty and boolean forms to null', () => {
    expect(resolveFocusTarget()).toBeNull()
    expect(resolveFocusTarget(null)).toBeNull()
    expect(resolveFocusTarget(false)).toBeNull()
    expect(resolveFocusTarget(true)).toBeNull()
    expect(resolveFocusTarget(React.createRef<HTMLElement>())).toBeNull()
    expect(resolveFocusTarget(() => null)).toBeNull()
  })
})

describe('resolveShardElements', () => {
  it('keeps only connected elements and resolved refs', () => {
    const live = document.createElement('div')
    const dead = document.createElement('div')
    document.body.appendChild(live)
    try {
      const liveRef = React.createRef<HTMLElement>()
      ;(liveRef as React.MutableRefObject<HTMLElement | null>).current = live
      expect(
        resolveShardElements([live, dead, liveRef, React.createRef<HTMLElement>()])
      ).toEqual([live, live])
    } finally {
      document.body.removeChild(live)
    }
  })

  it('resolves missing shards to an empty list', () => {
    expect(resolveShardElements()).toEqual([])
    expect(resolveShardElements([])).toEqual([])
  })
})
