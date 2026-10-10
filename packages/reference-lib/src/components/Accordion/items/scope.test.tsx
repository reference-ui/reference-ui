/** Nesting-isolation proof: item children re-scope to null, the rest passes through. */
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { AccordionContext } from '../context'
import { scopeItemChildren } from './scope'

function Item(props: { id?: string; children?: React.ReactNode }) {
  return React.createElement('div', props)
}

const itemTypes = [Item]

function onlyChild(element: React.ReactElement): React.ReactElement {
  const children = React.Children.toArray(
    (element.props as { children?: React.ReactNode }).children
  )
  expect(children).toHaveLength(1)
  const child = children[0] as React.ReactElement
  expect(React.isValidElement(child)).toBe(true)
  return child
}

describe('scopeItemChildren', () => {
  it('wraps each item child in a null Accordion scope (AC-NEST-02)', () => {
    const scoped = React.Children.toArray(
      scopeItemChildren(
        React.createElement(Item, { id: 'a' }, React.createElement('span', null, 'panel')),
        itemTypes
      )
    )
    expect(scoped).toHaveLength(1)
    const item = scoped[0] as React.ReactElement
    expect(item.type).toBe(Item)
    expect((item.props as { id?: string }).id).toBe('a')
    const provider = onlyChild(item)
    expect(provider.type).toBe(AccordionContext.Provider)
    expect((provider.props as { value: null }).value).toBeNull()
    const panel = onlyChild(provider)
    expect(panel.type).toBe('span')
  })

  it('scopes items nested inside fragments', () => {
    const scoped = React.Children.toArray(
      scopeItemChildren(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(Item, { id: 'a' }, 'panel')
        ),
        itemTypes
      )
    )
    expect(scoped).toHaveLength(1)
    const fragment = scoped[0] as React.ReactElement
    expect(fragment.type).toBe(React.Fragment)
    const inner = React.Children.toArray((fragment.props as { children?: React.ReactNode }).children)
    expect(inner).toHaveLength(1)
    const item = inner[0] as React.ReactElement
    expect(item.type).toBe(Item)
    expect(onlyChild(item).type).toBe(AccordionContext.Provider)
  })

  it('passes hosts, text, and null through without a scope', () => {
    const mixed = React.Children.toArray(
      scopeItemChildren(
        [
          React.createElement('div', { key: 'host', id: 'host' }),
          'text',
          null,
        ],
        itemTypes
      )
    )
    expect(mixed).toHaveLength(2)
    const [host, text] = mixed as [React.ReactElement, string]
    expect(host?.type).toBe('div')
    expect((host?.props as { id?: string }).id).toBe('host')
    expect(text).toBe('text')
    expect(scopeItemChildren(null, itemTypes)).toBe(null)
    expect(scopeItemChildren(undefined, itemTypes)).toBe(undefined)
  })
})
