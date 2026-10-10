/** Mount-policy proof: precedence, Presence keep-alive, beforematch reveals. */
import { describe, expect, it } from 'vitest'
import { resolveMountPolicy, resolvePresent, shouldRevealOnBeforeMatch } from './policy'

describe('resolveMountPolicy', () => {
  it('lets the Content prop win over the root default either way', () => {
    expect(resolveMountPolicy({ contentProp: true, rootDefault: false, forceMount: false })).toEqual(
      { untilFound: true, forceMountAlone: false }
    )
    expect(resolveMountPolicy({ contentProp: false, rootDefault: true, forceMount: false })).toEqual(
      { untilFound: false, forceMountAlone: false }
    )
    expect(
      resolveMountPolicy({ contentProp: undefined, rootDefault: true, forceMount: false })
    ).toEqual({ untilFound: true, forceMountAlone: false })
    expect(
      resolveMountPolicy({ contentProp: undefined, rootDefault: false, forceMount: false })
    ).toEqual({ untilFound: false, forceMountAlone: false })
  })

  it('lets hidden-until-found win over force-mount (CO-MOUNT)', () => {
    expect(resolveMountPolicy({ contentProp: true, rootDefault: false, forceMount: true })).toEqual(
      { untilFound: true, forceMountAlone: false }
    )
    expect(
      resolveMountPolicy({ contentProp: undefined, rootDefault: true, forceMount: true })
    ).toEqual({ untilFound: true, forceMountAlone: false })
    expect(
      resolveMountPolicy({ contentProp: false, rootDefault: false, forceMount: true })
    ).toEqual({ untilFound: false, forceMountAlone: true })
  })
})

describe('resolvePresent', () => {
  it('keeps open, findable, or force-mounted content in the tree', () => {
    expect(resolvePresent({ isOpen: true, untilFound: false, forceMount: false })).toBe(true)
    expect(resolvePresent({ isOpen: false, untilFound: true, forceMount: false })).toBe(true)
    expect(resolvePresent({ isOpen: false, untilFound: false, forceMount: true })).toBe(true)
    expect(resolvePresent({ isOpen: false, untilFound: false, forceMount: false })).toBe(false)
  })
})

describe('shouldRevealOnBeforeMatch', () => {
  it('reveals only a live, still-closed panel the consumer did not cancel', () => {
    expect(
      shouldRevealOnBeforeMatch({ defaultPrevented: false, isConnected: true, isOpen: false })
    ).toBe(true)
    expect(
      shouldRevealOnBeforeMatch({ defaultPrevented: true, isConnected: true, isOpen: false })
    ).toBe(false)
    expect(
      shouldRevealOnBeforeMatch({ defaultPrevented: false, isConnected: false, isOpen: false })
    ).toBe(false)
    expect(
      shouldRevealOnBeforeMatch({ defaultPrevented: false, isConnected: true, isOpen: true })
    ).toBe(false)
  })
})
