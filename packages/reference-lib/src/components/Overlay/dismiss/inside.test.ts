// @vitest-environment happy-dom
import { describe, expect, it, beforeEach } from 'vitest'
import { overlayStackStore } from '../stack'
import { isInsideLayer } from './inside'
import type { Layer } from '../stack'

const flags = { focus: false, inert: false, scroll: false }

function sample(layer: Layer, target: EventTarget): boolean {
  let result = false
  const onClick = (event: Event) => {
    result = isInsideLayer(layer, event)
  }
  target.addEventListener('click', onClick)
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  target.removeEventListener('click', onClick)
  return result
}

describe('isInsideLayer', () => {
  beforeEach(() => {
    overlayStackStore.getState().reset()
  })

  it('treats Content, Trigger, and ignore markers as inside', () => {
    const content = document.createElement('div')
    const inner = document.createElement('button')
    content.appendChild(inner)
    const trigger = document.createElement('button')
    const ignored = document.createElement('div')
    ignored.setAttribute('data-reference-overlay-ignore', '')
    document.body.append(content, trigger, ignored)

    const top: Layer = {
      id: 'top',
      parentId: null,
      dismiss: () => {},
      isModal: false,
      isolation: flags,
      open: true,
      zIndex: 100,
      node: content,
      backdrop: null,
      trigger,
      document,
    }

    expect(sample(top, inner)).toBe(true)
    expect(sample(top, trigger)).toBe(true)
    expect(sample(top, ignored)).toBe(true)
    expect(sample(top, document.body)).toBe(false)

    content.remove()
    trigger.remove()
    ignored.remove()
  })

  it('treats a descendant layer as inside the ancestor', () => {
    const parentNode = document.createElement('div')
    const childNode = document.createElement('div')
    const childInner = document.createElement('button')
    childNode.appendChild(childInner)
    document.body.append(parentNode, childNode)

    overlayStackStore.getState().addLayer({
      id: 'parent',
      parentId: null,
      dismiss: () => {},
      isModal: false,
      isolation: flags,
      open: true,
      node: parentNode,
      backdrop: null,
      trigger: null,
      document,
    })
    overlayStackStore.getState().addLayer({
      id: 'child',
      parentId: 'parent',
      dismiss: () => {},
      isModal: false,
      isolation: flags,
      open: true,
      node: childNode,
      backdrop: null,
      trigger: null,
      document,
    })

    const parent = overlayStackStore.getState().layers.find(l => l.id === 'parent')!
    expect(sample(parent, childInner)).toBe(true)

    parentNode.remove()
    childNode.remove()
  })
})
