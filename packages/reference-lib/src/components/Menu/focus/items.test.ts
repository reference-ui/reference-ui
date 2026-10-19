// @vitest-environment happy-dom
/**
 * Item-discovery proof: single-level scoping, first/edge moves, and the
 * pointer-open roving mirror. Runs in happy-dom against real menus;
 * entry focus consumes it.
 */
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  ENABLED_MENUITEM_SELECTOR,
  focusEdgeEnabledItem,
  focusFirstEnabledItem,
  handleContentContainerKey,
  levelItems,
} from './items'

function menu(): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = [
    '<div data-reference-menu-content id="menu">',
    '<div role="menuitem" id="i1" tabindex="0">one</div>',
    '<div role="menuitem" id="i2" tabindex="0" aria-disabled="true">two</div>',
    '<div role="menuitemcheckbox" id="i3" tabindex="0">three</div>',
    '<div data-reference-menu-content id="nested">',
    '<div role="menuitem" id="n1" tabindex="0">nested</div>',
    '</div>',
    '</div>',
  ].join('')
  document.body.appendChild(host)
  return host.querySelector<HTMLElement>('#menu')!
}

function keyEvent(target: HTMLElement, currentTarget: HTMLElement, keyName: string) {
  return {
    target,
    currentTarget,
    key: keyName,
    preventDefault: () => {},
  } as unknown as React.KeyboardEvent<HTMLDivElement>
}

describe('menu item focus', () => {
  it('scopes discovery to the level, skipping disabled items', () => {
    const content = menu()
    expect(levelItems(content).map(el => el.id)).toEqual(['i1', 'i3'])
    expect(levelItems(null)).toEqual([])
    expect(ENABLED_MENUITEM_SELECTOR).toContain('menuitemradio')
    content.parentElement!.remove()
  })

  it('focuses first and edge items', () => {
    const content = menu()
    focusFirstEnabledItem(content)
    expect(document.activeElement?.id).toBe('i1')
    focusEdgeEnabledItem(content, 'last')
    expect(document.activeElement?.id).toBe('i3')
    focusEdgeEnabledItem(content, 'first')
    expect(document.activeElement?.id).toBe('i1')
    content.parentElement!.remove()
  })

  it('moves container arrows to the edge item, ignoring item targets', () => {
    const content = menu()
    content.tabIndex = -1
    const item = content.querySelector<HTMLElement>('#i1')!
    expect(handleContentContainerKey(keyEvent(content, content, 'ArrowDown'), content)).toBe(true)
    expect(document.activeElement?.id).toBe('i1')
    expect(handleContentContainerKey(keyEvent(content, content, 'ArrowUp'), content)).toBe(true)
    expect(document.activeElement?.id).toBe('i3')
    expect(handleContentContainerKey(keyEvent(item, content, 'ArrowDown'), content)).toBe(false)
    expect(handleContentContainerKey(keyEvent(content, content, 'Enter'), content)).toBe(false)
    content.parentElement!.remove()
  })
})
