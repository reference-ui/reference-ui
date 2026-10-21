// Vitest tests for the style-prop vocabulary reference.
// They take prop names and query inputs and assert the predicate plus the shared guide text.
import { describe, expect, it } from 'vitest'
import { getStylePropsReference, isStylePropName } from './style-props'

describe('isStylePropName', () => {
  it.each([
    ['p', true],
    ['border', true],
    ['background', true],
    ['bg', true],
    ['backgroundColor', true],
    ['_hover', true],
    ['_disabled', true],
    ['&:hover', true],
    ['@md', true],
    ['r', true],
    ['container', true],
    ['css', true],
    ['font', true],
    ['weight', true],
    ['disabled', false],
    ['checked', false],
    ['open', false],
    ['expanded', false],
    ['align', false],
    ['textarea', false],
    ['variant', false],
    ['colorMode', false],
    ['className', false],
    ['children', false],
    ['ref', false],
  ])('isStylePropName(%s) is %s', (name, expected) => {
    expect(isStylePropName(name)).toBe(expected)
  })
})

describe('mcp style prop reference', () => {
  it('lists only names isStylePropName accepts', () => {
    const reference = getStylePropsReference({ includeProps: true })
    for (const category of reference.categories) {
      const props = 'props' in category ? (category.props ?? []) : []
      expect(props.length, `${category.name} lists props`).toBeGreaterThan(0)
      expect(props.filter(prop => !isStylePropName(prop)), category.name).toEqual([])
    }
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
