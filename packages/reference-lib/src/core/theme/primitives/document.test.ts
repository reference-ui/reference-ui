// Vitest tests for the document primitive styles.
// They take the style map and assert Span inherits color instead of pinning body text,
// keeping it legible on dark surfaces.
import { describe, it, expect } from 'vitest'
import { documentPrimitiveStyles } from './document'

describe('document primitives (B-09/W-03 dark-surface story)', () => {
  it('lets Span inherit color instead of pinning the body text color', () => {
    const spanStyles = (documentPrimitiveStyles as any)['.ref-span']

    expect(spanStyles).toBeDefined()
    expect(spanStyles.color).toBe('inherit')
  })
})

describe('icon shell colour (BT-ICON-01)', () => {
  it('keeps the Div colour pin off the icon slot so icons inherit their container colour', async () => {
    const { base } = await import('./base')
    const pinned = [...Object.keys(base), ...Object.keys(documentPrimitiveStyles)].filter(
      selector =>
        /\.ref-div\b/.test(selector) &&
        'color' in ((base as any)[selector] ?? (documentPrimitiveStyles as any)[selector]),
    )

    expect(pinned.length).toBeGreaterThan(0)
    for (const selector of pinned) {
      for (const part of selector.split(',').filter(p => p.includes('.ref-div'))) {
        expect(part.trim()).toBe('.ref-div:where(:not([data-slot="icon"]))')
      }
    }
  })
})
