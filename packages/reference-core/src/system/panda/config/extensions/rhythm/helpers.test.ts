import { describe, it, expect } from 'vitest'
import { getRhythm, resolveRhythm } from './helpers'

describe('getRhythm', () => {
  it('returns var(--spacing-r) for 1', () => {
    expect(getRhythm(1)).toBe('var(--spacing-r)')
  })

  it('returns calc for integer units', () => {
    expect(getRhythm(2)).toBe('calc(2 * var(--spacing-r))')
  })

  it('returns calc for fractional units', () => {
    expect(getRhythm(0.5)).toBe('calc(0.5 * var(--spacing-r))')
  })

  it('returns calc for fractional with denominator', () => {
    expect(getRhythm(1, 3)).toBe('calc(var(--spacing-r) / 3)')
  })

  it('returns calc for num/denom', () => {
    expect(getRhythm(2, 3)).toBe('calc(2 * var(--spacing-r) / 3)')
  })
})

describe('resolveRhythm', () => {
  it('resolves "2r" to calc', () => {
    expect(resolveRhythm('2r')).toBe('calc(2 * var(--spacing-r))')
  })

  it('passes through non-r strings', () => {
    expect(resolveRhythm('1rem')).toBe('1rem')
  })

  it('passes through slash rhythm tokens for predefined token resolution', () => {
    expect(resolveRhythm('1/5r')).toBe('1/5r')
  })

  it('passes through numbers', () => {
    expect(resolveRhythm(4)).toBe(4)
  })
})
