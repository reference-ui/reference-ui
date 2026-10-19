// @vitest-environment happy-dom
/**
 * Level-registry proof: descendant orderings and deepest-first closing.
 * Pins the tree walks dismissal and nesting both rely on.
 */
import { describe, expect, it } from 'vitest'
import type { MenuLevelValue, SubmenuRegistration } from '../context'
import {
  MENU_ROOT_ID,
  isLevelDescendantOf,
  levelDirection,
  openRegistrationsDeepestFirst,
  rootTriggerOf,
} from './registry'

function reg(over: Partial<SubmenuRegistration> & { id: string }): SubmenuRegistration {
  return {
    depth: 1,
    parentId: MENU_ROOT_ID,
    isOpen: true,
    getTrigger: () => null,
    getContent: () => null,
    requestClose: () => {},
    ...over,
  }
}

describe('menu level registry', () => {
  it('orders open registrations deepest-first', () => {
    const registry = new Map<string, SubmenuRegistration>([
      ['a', reg({ id: 'a', depth: 1, isOpen: true })],
      ['b', reg({ id: 'b', depth: 3, isOpen: true })],
      ['c', reg({ id: 'c', depth: 2, isOpen: false })],
      ['d', reg({ id: 'd', depth: 2, isOpen: true })],
    ])
    expect(openRegistrationsDeepestFirst(registry).map(r => r.id)).toEqual(['b', 'd', 'a'])
  })

  it('walks ancestry through parent ids', () => {
    const registry = new Map<string, SubmenuRegistration>([
      ['a', reg({ id: 'a', parentId: MENU_ROOT_ID })],
      ['b', reg({ id: 'b', parentId: 'a' })],
      ['c', reg({ id: 'c', parentId: 'b' })],
    ])
    expect(isLevelDescendantOf(registry, 'c', 'a')).toBe(true)
    expect(isLevelDescendantOf(registry, 'c', 'b')).toBe(true)
    expect(isLevelDescendantOf(registry, 'b', 'c')).toBe(false)
    expect(isLevelDescendantOf(registry, 'a', 'a')).toBe(false)
    expect(isLevelDescendantOf(registry, 'missing', 'a')).toBe(false)
  })

  it('resolves the root trigger up the level chain', () => {
    const trigger = document.createElement('button')
    const root = { parent: null, getTrigger: () => trigger } as unknown as MenuLevelValue
    const child = { parent: root, getTrigger: () => null } as unknown as MenuLevelValue
    const grand = { parent: child, getTrigger: () => null } as unknown as MenuLevelValue
    expect(rootTriggerOf(grand)).toBe(trigger)
    expect(rootTriggerOf(null)).toBeNull()
  })

  it('reads direction from the root trigger, falling back to level nodes', () => {
    const rtl = document.createElement('div')
    rtl.style.direction = 'rtl'
    document.body.appendChild(rtl)
    const root = { parent: null, getTrigger: () => rtl } as unknown as MenuLevelValue
    const child = { parent: root, getTrigger: () => null } as unknown as MenuLevelValue
    expect(levelDirection(child)).toBe('rtl')
    const bare = { parent: null, getTrigger: () => null, getContentNode: () => null } as unknown as MenuLevelValue
    expect(levelDirection(bare)).toBe('ltr')
    rtl.remove()
  })
})
