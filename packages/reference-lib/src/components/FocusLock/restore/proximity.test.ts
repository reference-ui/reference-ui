// @vitest-environment happy-dom
/** Isolation proof for proximity restore: right, left, subtree, ancestor. */
import { describe, expect, it } from 'vitest'
import { findFocusableProximity } from './proximity'

describe('findFocusableProximity', () => {
  it('returns the node itself while it stays connected and focusable', () => {
    const node = document.createElement('button')
    document.body.appendChild(node)
    try {
      expect(findFocusableProximity(node, document.body, null, null)).toBe(node)
    } finally {
      document.body.removeChild(node)
    }
  })

  it('walks right, then left, then ancestor for a removed node', () => {
    const wrap = document.createElement('div')
    wrap.tabIndex = 0
    const left = document.createElement('button')
    const gone = document.createElement('button')
    const right = document.createElement('button')
    wrap.append(left, gone, right)
    document.body.appendChild(wrap)
    try {
      gone.remove()
      expect(findFocusableProximity(gone, wrap, right, left)).toBe(right)
      right.remove()
      expect(findFocusableProximity(gone, wrap, null, left)).toBe(left)
      left.remove()
      expect(findFocusableProximity(null, wrap, null, null)).toBe(wrap)
    } finally {
      document.body.removeChild(wrap)
    }
  })

  it('descends into surviving sibling subtrees', () => {
    const wrap = document.createElement('div')
    const gone = document.createElement('button')
    const right = document.createElement('div')
    const nested = document.createElement('button')
    right.appendChild(nested)
    wrap.append(gone, right)
    document.body.appendChild(wrap)
    try {
      gone.remove()
      expect(findFocusableProximity(gone, wrap, right, null)).toBe(nested)
    } finally {
      document.body.removeChild(wrap)
    }
  })

  it('returns null when no live replacement exists', () => {
    const gone = document.createElement('button')
    expect(findFocusableProximity(gone, null, null, null)).toBeNull()
  })
})
