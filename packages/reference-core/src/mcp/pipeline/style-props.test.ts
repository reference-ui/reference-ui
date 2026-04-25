import { describe, expect, it } from 'vitest'
import { getStylePropsReference, isStylePropName } from './style-props'

describe('mcp style prop reference', () => {
  it('detects common Reference UI style props', () => {
    expect(isStylePropName('p')).toBe(true)
    expect(isStylePropName('backgroundColor')).toBe(true)
    expect(isStylePropName('variant')).toBe(false)
  })

  it('returns a concise reference by default', () => {
    const reference = getStylePropsReference()

    expect(reference.includeProps).toBe(false)
    expect(reference.categories.some(category => category.name === 'color')).toBe(true)
    expect(reference.categories[0]).toHaveProperty('exampleProps')
    expect(reference.categories[0]).not.toHaveProperty('props')
  })

  it('prefers exact prop matches for focused queries', () => {
    const reference = getStylePropsReference({ query: 'r', includeProps: true })

    expect(reference.matchedProp).toBe('r')
    expect(reference.categories).toEqual([
      expect.objectContaining({
        name: 'reference-ui',
        props: ['r'],
      }),
    ])
  })
})
