/** Traversal-math proof: wrap-around arrows, disabled skips, Home/End landings. */
import { describe, expect, it } from 'vitest'
import {
  findNextEnabledIndex,
  firstEnabledIndex,
  isHeaderEnabled,
  lastEnabledIndex,
  type HeaderCandidate,
} from './traversal'

function header(disabled = false, attribute = disabled): HeaderCandidate {
  return {
    disabled,
    hasAttribute: (name: string) => (name === 'disabled' ? attribute : false),
  }
}

describe('isHeaderEnabled', () => {
  it('requires both the property and the attribute to be clear', () => {
    expect(isHeaderEnabled(header(false, false))).toBe(true)
    expect(isHeaderEnabled(header(true, false))).toBe(false)
    expect(isHeaderEnabled(header(false, true))).toBe(false)
    expect(isHeaderEnabled(header(true, true))).toBe(false)
  })
})

describe('findNextEnabledIndex', () => {
  it('steps to the neighbor in each direction', () => {
    const triggers = [header(), header(), header()]
    expect(findNextEnabledIndex(triggers, 0, 1)).toBe(1)
    expect(findNextEnabledIndex(triggers, 1, -1)).toBe(0)
  })

  it('wraps around both ends of the header order', () => {
    const triggers = [header(), header(), header()]
    expect(findNextEnabledIndex(triggers, 2, 1)).toBe(0)
    expect(findNextEnabledIndex(triggers, 0, -1)).toBe(2)
  })

  it('skips disabled headers while wrapping', () => {
    const triggers = [header(), header(true), header()]
    expect(findNextEnabledIndex(triggers, 0, 1)).toBe(2)
    expect(findNextEnabledIndex(triggers, 2, -1)).toBe(0)
    expect(findNextEnabledIndex(triggers, 0, -1)).toBe(2)
  })

  it('returns -1 when no header can take focus', () => {
    expect(findNextEnabledIndex([], 0, 1)).toBe(-1)
    expect(findNextEnabledIndex([header(true)], 0, 1)).toBe(-1)
    expect(findNextEnabledIndex([header(true), header(false, true)], 0, -1)).toBe(-1)
  })

  it('lands back on a lone enabled header', () => {
    const triggers = [header(true), header(), header(true)]
    expect(findNextEnabledIndex(triggers, 1, 1)).toBe(1)
    expect(findNextEnabledIndex(triggers, 0, 1)).toBe(1)
  })
})

describe('firstEnabledIndex / lastEnabledIndex', () => {
  it('lands Home on the first and End on the last enabled header', () => {
    const triggers = [header(true), header(), header(), header(true)]
    expect(firstEnabledIndex(triggers)).toBe(1)
    expect(lastEnabledIndex(triggers)).toBe(2)
  })

  it('returns -1 when every header is disabled', () => {
    expect(firstEnabledIndex([])).toBe(-1)
    expect(lastEnabledIndex([])).toBe(-1)
    expect(firstEnabledIndex([header(true)])).toBe(-1)
    expect(lastEnabledIndex([header(true)])).toBe(-1)
  })
})
