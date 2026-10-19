/**
 * Item-detection proof: known identities, disclosure duck-typing, and
 * host rejects. Pure element reads with no mount; collection order proves
 * out in the sibling collect suite.
 */
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { isItemElement } from './match'

function Disclosure(props: Record<string, unknown>) {
  return React.createElement('div', props)
}

function Other(props: Record<string, unknown>) {
  return React.createElement('div', props)
}

describe('isItemElement', () => {
  const itemTypes = [Disclosure, Other]

  it('accepts elements whose type is a known item identity', () => {
    expect(isItemElement(React.createElement(Disclosure, {}), itemTypes)).toBe(true)
    expect(isItemElement(React.createElement(Disclosure, { id: 'a' }), itemTypes)).toBe(true)
  })

  it('accepts unknown components that duck-type as a disclosure', () => {
    const Unknown = (props: Record<string, unknown>) => React.createElement('div', props)
    expect(isItemElement(React.createElement(Unknown, { id: 'a' }), itemTypes)).toBe(true)
    expect(isItemElement(React.createElement(Unknown, { open: true }), itemTypes)).toBe(true)
    expect(isItemElement(React.createElement(Unknown, { disabled: true }), itemTypes)).toBe(true)
    expect(isItemElement(React.createElement(Unknown, { title: 'a' }), itemTypes)).toBe(false)
  })

  it('rejects host elements even when they carry disclosure props', () => {
    expect(isItemElement(React.createElement('div', { id: 'a' }), itemTypes)).toBe(false)
    expect(isItemElement(React.createElement('button', { disabled: true }), itemTypes)).toBe(false)
  })

  it('rejects fragments and prop-less unknown components', () => {
    const Unknown = () => React.createElement('div', null)
    expect(
      isItemElement(React.createElement(React.Fragment, null, 'x'), itemTypes)
    ).toBe(false)
    expect(isItemElement(React.createElement(Unknown, null), itemTypes)).toBe(false)
  })
})
