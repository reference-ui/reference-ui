import { describe, it, expect } from 'vitest'
import { getRhythm, resolveRhythm } from './helpers'

describe('getRhythm', () => {
  it('returns var(--spacing-root) for 1', () => {
    expect(getRhythm(1)).toBe('var(--spacing-root)')
  })

  it('returns calc for integer units', () => {
    expect(getRhythm(2)).toBe('calc(2 * var(--spacing-root))')
  })

  it('returns calc for fractional units', () => {
    expect(getRhythm(0.5)).toBe('calc(0.5 * var(--spacing-root))')
  })

  it('returns calc for fractional with denominator', () => {
    expect(getRhythm(1, 3)).toBe('calc(var(--spacing-root) / 3)')
  })

  it('returns calc for num/denom', () => {
    expect(getRhythm(2, 3)).toBe('calc(2 * var(--spacing-root) / 3)')
  })
})

describe('resolveRhythm', () => {
  it('resolves "2r" to calc', () => {
    expect(resolveRhythm('2r')).toBe('calc(2 * var(--spacing-root))')
  })

  it('resolves "1/5r" to calc', () => {
    expect(resolveRhythm('1/5r')).toBe('calc(var(--spacing-root) / 5)')
  })

  it('resolves signed fraction rhythm strings', () => {
    expect(resolveRhythm('-2/3r')).toBe('calc(-2 * var(--spacing-root) / 3)')
  })

  it('passes through non-r strings', () => {
    expect(resolveRhythm('1rem')).toBe('1rem')
    expect(resolveRhythm('0.34rem')).toBe('0.34rem')
    expect(resolveRhythm('12%')).toBe('12%')
    expect(resolveRhythm('auto')).toBe('auto')
  })

  it('resolves whitespace-separated rhythm shorthands without clobbering other CSS units', () => {
    expect(resolveRhythm('1r 2r')).toBe(
      'var(--spacing-root) calc(2 * var(--spacing-root))',
    )
    expect(resolveRhythm('0.34rem 2r')).toBe(
      '0.34rem calc(2 * var(--spacing-root))',
    )
    expect(resolveRhythm('1r 0.34rem 3r auto')).toBe(
      'var(--spacing-root) 0.34rem calc(3 * var(--spacing-root)) auto',
    )
    expect(resolveRhythm('12% 1r')).toBe('12% var(--spacing-root)')
  })

  it('leaves complex grammar and function values untouched', () => {
    expect(resolveRhythm('calc(0.34rem + 1r)')).toBe('calc(0.34rem + 1r)')
    expect(resolveRhythm('min(0.34rem, 1r)')).toBe('min(0.34rem, 1r)')
    expect(resolveRhythm('var(--space-2) 1r')).toBe('var(--space-2) 1r')
  })

  it('passes through invalid fraction rhythm strings', () => {
    expect(resolveRhythm('1//5r')).toBe('1//5r')
    expect(resolveRhythm('1/0r')).toBe('1/0r')
  })

  it('passes through numbers', () => {
    expect(resolveRhythm(4)).toBe(4)
  })
})
