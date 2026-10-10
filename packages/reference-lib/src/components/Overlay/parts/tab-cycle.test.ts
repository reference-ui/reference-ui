// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { nextAfter, tabbables } from './tab-cycle'

function button(id: string, disabled = false): HTMLButtonElement {
  const el = document.createElement('button')
  el.id = id
  el.textContent = id
  if (disabled) el.disabled = true
  return el
}

describe('tab-cycle', () => {
  it('lists visible tabbables and skips disabled ones', () => {
    const root = document.createElement('div')
    root.append(button('a'), button('b', true), button('c'))
    document.body.appendChild(root)
    try {
      expect(tabbables(root).map(el => el.id)).toEqual(['a', 'c'])
    } finally {
      document.body.removeChild(root)
    }
  })

  it('skips inert subtrees', () => {
    const root = document.createElement('div')
    const inertHost = document.createElement('div')
    inertHost.setAttribute('inert', '')
    inertHost.appendChild(button('inert-child'))
    root.append(button('visible'), inertHost)
    document.body.appendChild(root)
    try {
      expect(tabbables(root).map(el => el.id)).toEqual(['visible'])
    } finally {
      document.body.removeChild(root)
    }
  })

  it('finds the next tabbable, skipping an excluded subtree', () => {
    const root = document.createElement('div')
    const popup = document.createElement('div')
    popup.appendChild(button('p1'))
    root.append(button('a'), popup, button('b'))
    document.body.appendChild(root)
    try {
      const a = root.querySelector<HTMLElement>('#a')!
      expect(nextAfter(a)?.id).toBe('p1')
      expect(nextAfter(a, popup)?.id).toBe('b')
      expect(nextAfter(root.querySelector<HTMLElement>('#b')!)).toBe(null)
    } finally {
      document.body.removeChild(root)
    }
  })
})
