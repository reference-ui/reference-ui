import { describe, expect, it } from 'vitest'
import {
  hasActiveFiniteAnimations,
  isActiveFiniteAnimation,
  isWaitableAnimation,
  type WaapiAnimation,
} from './animations'

/** Unit proof for `exit/animations`: WAAPI verdicts over fake animations. */

function fake(
  playState: string,
  timing?: { duration?: number; delay?: number; iterations?: number }
): WaapiAnimation {
  return {
    playState,
    effect: timing ? { getTiming: () => ({ ...timing }) } : null,
  }
}

describe('isActiveFiniteAnimation', () => {
  it('holds the exit for a running finite animation with duration', () => {
    expect(fake('running', { duration: 300, delay: 0, iterations: 1 })).toSatisfy(
      isActiveFiniteAnimation
    )
  })

  it('releases finished, infinite, timeless, and timing-less animations', () => {
    expect(
      fake('finished', { duration: 300, delay: 0, iterations: 1 })
    ).not.toSatisfy(isActiveFiniteAnimation)
    expect(
      fake('running', { duration: 300, delay: 0, iterations: Infinity })
    ).not.toSatisfy(isActiveFiniteAnimation)
    expect(fake('running', { duration: 0, delay: 0, iterations: 1 })).not.toSatisfy(
      isActiveFiniteAnimation
    )
    expect(fake('running')).not.toSatisfy(isActiveFiniteAnimation)
  })

  it('counts delay toward the finite total', () => {
    expect(fake('pending', { duration: 0, delay: 100, iterations: 1 })).toSatisfy(
      isActiveFiniteAnimation
    )
  })
})

describe('hasActiveFiniteAnimations', () => {
  it('scans a list for any exit-holding animation', () => {
    expect(
      hasActiveFiniteAnimations([
        fake('finished', { duration: 300, delay: 0, iterations: 1 }),
        fake('running', { duration: 200, delay: 0, iterations: 2 }),
      ])
    ).toBe(true)
    expect(
      hasActiveFiniteAnimations([
        fake('finished', { duration: 300, delay: 0, iterations: 1 }),
        fake('running', { duration: 300, delay: 0, iterations: Infinity }),
      ])
    ).toBe(false)
    expect(hasActiveFiniteAnimations([])).toBe(false)
  })
})

describe('isWaitableAnimation', () => {
  it('attaches to everything except infinite iterations', () => {
    expect(isWaitableAnimation(fake('running', { duration: 0, delay: 0, iterations: 1 }))).toBe(
      true
    )
    expect(isWaitableAnimation(fake('running'))).toBe(true)
    expect(
      isWaitableAnimation(fake('running', { duration: 300, delay: 0, iterations: Infinity }))
    ).toBe(false)
  })
})
