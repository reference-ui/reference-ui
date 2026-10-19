// @vitest-environment happy-dom
/** Unit proof for the editable activation guards: presses and clicks
 * starting in nested inputs, selects, textareas, or contenteditables
 * never select the tab. Pure over DOM nodes. */
import { describe, expect, it } from 'vitest'
import { TAB_EDITABLE_SELECTOR, isEditableClickTarget } from './editable'

describe('isEditableClickTarget', () => {
  it('matches inputs, selects, textareas, and contenteditables', () => {
    const host = document.createElement('div')
    host.innerHTML = [
      '<input id="i">',
      '<textarea id="t"></textarea>',
      '<select id="s"></select>',
      '<div id="c" contenteditable="true"></div>',
      '<div id="f" contenteditable="false"></div>',
      '<span id="p">label</span>',
    ].join('')
    document.body.appendChild(host)
    const q = (id: string) => host.querySelector(id)
    expect(isEditableClickTarget(q('#i'))).toBe(true)
    expect(isEditableClickTarget(q('#t'))).toBe(true)
    expect(isEditableClickTarget(q('#s'))).toBe(true)
    expect(isEditableClickTarget(q('#c'))).toBe(true)
    expect(isEditableClickTarget(q('#f'))).toBe(false)
    expect(isEditableClickTarget(q('#p'))).toBe(false)
    expect(isEditableClickTarget(null)).toBe(false)
    expect(TAB_EDITABLE_SELECTOR).toContain('contenteditable')
    host.remove()
  })
})
