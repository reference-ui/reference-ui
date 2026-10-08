import { describe, it, expect } from 'vitest'
import { documentPrimitiveStyles } from './document'

describe('document primitives (B-09/W-03 dark-surface story)', () => {
  it('lets Span inherit color instead of pinning the body text color', () => {
    const spanStyles = (documentPrimitiveStyles as any)['.ref-span']

    expect(spanStyles).toBeDefined()
    expect(spanStyles.color).toBe('inherit')
  })
})
