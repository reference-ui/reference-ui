/** Isolation proof for direction: explicit wins, SSR falls back to ltr. */
import { describe, expect, it } from 'vitest'
import { resolveDir } from './dir'

describe('toast direction', () => {
  it('prefers the explicit prop and falls back to ltr without a document', () => {
    expect(resolveDir('rtl')).toBe('rtl')
    expect(resolveDir('ltr')).toBe('ltr')
    expect(resolveDir(undefined)).toBe('ltr')
    expect(resolveDir('auto')).toBe('ltr')
  })
})
