import { describe, expect, it } from 'vitest'
import { hasFiniteExitAnimation, hasFiniteExitTransition } from './effects'

/**
 * Unit proof for `exit/effects`: finite exit verdicts over CSS snapshots.
 * Pins the instant-removal contract (PR-INSTANT-02/03/04, PR-ANIMATION-04)
 * without a browser.
 */

describe('hasFiniteExitAnimation', () => {
  it('reports finite when a newly named animation has positive duration', () => {
    expect(
      hasFiniteExitAnimation(
        {
          animationName: 'fade-out',
          animationDuration: '300ms',
          animationDelay: '0s',
          animationIterationCount: '1',
        },
        'fade-in'
      )
    ).toBe(true)
  })

  it('reports finite when delay alone makes the total positive', () => {
    expect(
      hasFiniteExitAnimation(
        {
          animationName: 'fade-out',
          animationDuration: '0s',
          animationDelay: '100ms',
          animationIterationCount: '1',
        },
        'none'
      )
    ).toBe(true)
  })

  it('ignores a preexisting animation whose name did not change', () => {
    expect(
      hasFiniteExitAnimation(
        {
          animationName: 'ambient',
          animationDuration: '300ms',
          animationDelay: '0s',
          animationIterationCount: '1',
        },
        'ambient'
      )
    ).toBe(false)
  })

  it('ignores `none` and zero-duration animations', () => {
    expect(
      hasFiniteExitAnimation(
        {
          animationName: 'none',
          animationDuration: '300ms',
          animationDelay: '0s',
          animationIterationCount: '1',
        },
        'fade-in'
      )
    ).toBe(false)
    expect(
      hasFiniteExitAnimation(
        {
          animationName: 'fade-out',
          animationDuration: '0s',
          animationDelay: '0s',
          animationIterationCount: '1',
        },
        'none'
      )
    ).toBe(false)
  })

  it('ignores infinite iterations', () => {
    expect(
      hasFiniteExitAnimation(
        {
          animationName: 'spin',
          animationDuration: '1s',
          animationDelay: '0s',
          animationIterationCount: 'infinite',
        },
        'none'
      )
    ).toBe(false)
  })

  it('finds one finite entry among comma-separated lists', () => {
    expect(
      hasFiniteExitAnimation(
        {
          animationName: 'spin, fade-out',
          animationDuration: '1s, 200ms',
          animationDelay: '0s, 0s',
          animationIterationCount: 'infinite, 1',
        },
        'none'
      )
    ).toBe(true)
    expect(
      hasFiniteExitAnimation(
        {
          animationName: 'spin, pulse',
          animationDuration: '1s, 1s',
          animationDelay: '0s, 0s',
          animationIterationCount: 'infinite, infinite',
        },
        'none'
      )
    ).toBe(false)
  })
})

describe('hasFiniteExitTransition', () => {
  it('reports finite for a positive-duration property transition', () => {
    expect(
      hasFiniteExitTransition({
        transitionProperty: 'opacity, transform',
        transitionDuration: '0s, 200ms',
        transitionDelay: '0s, 0s',
      })
    ).toBe(true)
  })

  it('reports instant when every entry totals zero', () => {
    expect(
      hasFiniteExitTransition({
        transitionProperty: 'opacity, transform',
        transitionDuration: '0s, 0s',
        transitionDelay: '0s, 0s',
      })
    ).toBe(false)
  })

  it('reports instant for `none` properties', () => {
    expect(
      hasFiniteExitTransition({
        transitionProperty: 'none',
        transitionDuration: '300ms',
        transitionDelay: '0s',
      })
    ).toBe(false)
    expect(
      hasFiniteExitTransition({
        transitionProperty: '',
        transitionDuration: '',
        transitionDelay: '',
      })
    ).toBe(false)
  })

  it('counts delay toward the finite total', () => {
    expect(
      hasFiniteExitTransition({
        transitionProperty: 'opacity',
        transitionDuration: '0s',
        transitionDelay: '100ms',
      })
    ).toBe(true)
  })
})
