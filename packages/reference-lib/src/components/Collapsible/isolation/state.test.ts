/** Isolation proof: exiting-content lockdown, force-mount interactivity, author pass-through. */
import { describe, expect, it } from 'vitest'
import { resolveContentIsolation } from './state'

describe('resolveContentIsolation', () => {
  it('isolates visually exiting closed content (CO-PRES-08)', () => {
    expect(
      resolveContentIsolation({
        isOpen: false,
        forceMountAlone: false,
        userInert: undefined,
        userAriaHidden: undefined,
        style: { color: 'red' },
      })
    ).toEqual({
      isInert: true,
      isAriaHidden: 'true',
      contentStyle: { color: 'red', pointerEvents: 'none' },
    })
  })

  it('leaves open content alone', () => {
    const style = { color: 'red' }
    expect(
      resolveContentIsolation({
        isOpen: true,
        forceMountAlone: false,
        userInert: undefined,
        userAriaHidden: undefined,
        style,
      })
    ).toEqual({ isInert: false, isAriaHidden: undefined, contentStyle: { color: 'red' } })
  })

  it('keeps force-mount-alone closed content interactive (CO-MOUNT)', () => {
    expect(
      resolveContentIsolation({
        isOpen: false,
        forceMountAlone: true,
        userInert: undefined,
        userAriaHidden: undefined,
        style: undefined,
      })
    ).toEqual({ isInert: false, isAriaHidden: undefined, contentStyle: {} })
  })

  it('passes author inert and aria-hidden through on open content', () => {
    expect(
      resolveContentIsolation({
        isOpen: true,
        forceMountAlone: false,
        userInert: true,
        userAriaHidden: 'false',
        style: undefined,
      })
    ).toEqual({ isInert: true, isAriaHidden: 'false', contentStyle: {} })
  })
})
