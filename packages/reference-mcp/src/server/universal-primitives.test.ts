import { describe, expect, it } from 'vitest'
import {
  getUniversalComponent,
  getUniversalComponentExamples,
  getUniversalComponentProps,
  getUniversalComponents,
  getUniversalStyleProps,
  getUniversalTokens,
} from './universal-primitives'

describe('universal-primitives', () => {
  it('lists built-in primitives with mode metadata', () => {
    const res = getUniversalComponents()
    expect(res.mode).toBe('universal_primitives')
    expect(res.components.length).toBeGreaterThan(10)
    expect(res.components.some(c => c.name === 'Div')).toBe(true)
    expect(res.components.some(c => c.name === 'Button')).toBe(true)
  })

  it('filters components by query and limit', () => {
    const res = getUniversalComponents({ query: 'div', limit: 1 })
    expect(res.components.length).toBe(1)
    expect(res.components[0].name).toBe('Div')
  })

  it('returns component details for known primitive', () => {
    const res = getUniversalComponent('Button')
    expect('error' in res).toBe(false)
    if (!('error' in res)) {
      expect(res.name).toBe('Button')
      expect(res.kind).toBe('primitive')
      expect(res.source).toBe('@reference-ui/react')
    }
  })

  it('returns error for unknown component in universal mode', () => {
    const res = getUniversalComponent('UnknownCustomWidget')
    expect('error' in res).toBe(true)
  })

  it('returns props and style props for known primitive', () => {
    const res = getUniversalComponentProps('Div')
    expect('error' in res).toBe(false)
    if (!('error' in res)) {
      expect(res.props.some(p => p.name === 'children')).toBe(true)
      expect(res.props.some(p => p.name === 'padding')).toBe(true)
    }
  })

  it('returns examples for known primitive', () => {
    const res = getUniversalComponentExamples('Div')
    expect('error' in res).toBe(false)
    if (!('error' in res)) {
      expect(res.examples.length).toBeGreaterThan(0)
    }
  })

  it('returns token requirement notice', () => {
    const res = getUniversalTokens()
    expect(res.mode).toBe('universal_primitives')
    expect(res.tokens).toEqual([])
  })

  it('returns style props guide', () => {
    const res = getUniversalStyleProps()
    expect(res.mode).toBe('universal_primitives')
    expect(res.categories.length).toBeGreaterThan(0)
  })
})
