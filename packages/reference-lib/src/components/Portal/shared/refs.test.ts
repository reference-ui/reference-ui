/**
 * Isolated proof for `shared/refs`: the `isContainerRef` shape guard, with
 * no browser behavior and no component mount. Each accepted `container`
 * form passes through the guard exactly once in these assertions.
 */
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { isContainerRef } from './refs'

describe('isContainerRef', () => {
  it('recognizes ref objects holding an element or null', () => {
    const target = document.createElement('section')
    expect(isContainerRef({ current: target })).toBe(true)
    expect(isContainerRef({ current: null })).toBe(true)
    expect(isContainerRef({ current: document.createDocumentFragment() })).toBe(true)
  })

  it('recognizes React.createRef boxes', () => {
    expect(isContainerRef(React.createRef<HTMLDivElement>())).toBe(true)
  })

  it('rejects direct destinations, resolvers, and empty forms', () => {
    expect(isContainerRef(document.createElement('div'))).toBe(false)
    expect(isContainerRef(document.createDocumentFragment())).toBe(false)
    expect(isContainerRef(() => null)).toBe(false)
    expect(isContainerRef(null)).toBe(false)
    expect(isContainerRef(undefined)).toBe(false)
  })
})
