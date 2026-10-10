import { describe, expect, it } from 'vitest'
import { parseDuration } from './duration'

/** Unit proof for `exit/duration`: CSS time tokens in, milliseconds out. */

describe('parseDuration', () => {
  it('parses millisecond tokens as-is', () => {
    expect(parseDuration('300ms')).toBe(300)
    expect(parseDuration('0ms')).toBe(0)
  })

  it('converts second tokens to milliseconds', () => {
    expect(parseDuration('0.3s')).toBeCloseTo(300, 5)
    expect(parseDuration('2s')).toBe(2000)
  })

  it('treats blank and unparseable tokens as zero', () => {
    expect(parseDuration('')).toBe(0)
    expect(parseDuration('   ')).toBe(0)
    expect(parseDuration('none')).toBe(0)
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseDuration('  150ms  ')).toBe(150)
  })
})
