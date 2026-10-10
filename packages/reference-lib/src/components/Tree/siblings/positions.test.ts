import { describe, expect, it } from 'vitest'
import { updateContainerTreeitemPositions } from './positions'

function item() {
  const attrs = new Map<string, string>()
  return {
    attrs,
    setAttribute(name: string, value: string) {
      attrs.set(name, value)
    },
  }
}

describe('updateContainerTreeitemPositions', () => {
  it('numbers direct treeitem children with posinset and setsize', () => {
    const items = [item(), item(), item()]
    updateContainerTreeitemPositions({ querySelectorAll: () => items })
    expect(items.map(i => i.attrs.get('aria-posinset'))).toEqual(['1', '2', '3'])
    expect(items.map(i => i.attrs.get('aria-setsize'))).toEqual(['3', '3', '3'])
  })

  it('tolerates a null container', () => {
    expect(() => updateContainerTreeitemPositions(null)).not.toThrow()
  })
})
