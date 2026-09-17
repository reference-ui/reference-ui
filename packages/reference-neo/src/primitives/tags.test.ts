// Unit tests for the Neo primitive tag set.
// They take the copied list and assert its shape plus the map rule.
// The map rule is structural: patterns never appear as generated tags.

import { describe, expect, it } from 'vitest'
import { PRIMITIVE_JSX_NAMES, TAGS, toJsxName } from './tags.ts'

describe('primitive tags', () => {
  it('carries the platform tag set', () => {
    expect(TAGS).toContain('div')
    expect(TAGS).toContain('button')
    expect(TAGS).toContain('wbr')
    expect(TAGS.length).toBe(101)
  })

  it('maps tags to JSX names with reserved-word escapes', () => {
    expect(toJsxName('div')).toBe('Div')
    expect(toJsxName('h1')).toBe('H1')
    expect(toJsxName('object')).toBe('Obj')
    expect(toJsxName('var')).toBe('Var')
    expect(toJsxName('a')).toBe('A')
    expect(PRIMITIVE_JSX_NAMES).toContain('Div')
  })

  it('never lists Box, Flex, or Grid (map rule)', () => {
    expect(PRIMITIVE_JSX_NAMES).not.toContain('Box')
    expect(PRIMITIVE_JSX_NAMES).not.toContain('Flex')
    expect(PRIMITIVE_JSX_NAMES).not.toContain('Grid')
  })
})
