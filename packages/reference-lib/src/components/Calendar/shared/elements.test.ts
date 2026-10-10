import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { describeRendererNode, isPartElement } from './elements'

function Probe() {
  return null
}

describe('element-slot plumbing', () => {
  it('detects a direct part element and nothing else', () => {
    expect(isPartElement(React.createElement(Probe), Probe)).toBe(true)
    expect(isPartElement(React.createElement('div'), Probe)).toBe(false)
    expect(isPartElement(null, Probe)).toBe(false)
    expect(isPartElement('text', Probe)).toBe(false)
  })

  it('names received values for diagnostics', () => {
    expect(describeRendererNode(null)).toBe('no element')
    expect(describeRendererNode([1, 2])).toBe('an array of 2 nodes')
    expect(describeRendererNode(React.createElement(React.Fragment))).toBe('a Fragment')
    expect(describeRendererNode(React.createElement('td'))).toBe('a native <td>')
    expect(describeRendererNode(React.createElement(Probe))).toBe('a <Probe>')
    expect(describeRendererNode(42)).toBe('a number')
  })
})
