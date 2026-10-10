// @vitest-environment happy-dom
/** Isolated proof for collection/availability: the single predicate every
 * navigation, settlement, and search path consults. Pins the disabled,
 * hidden, and computed-style shapes against bare nodes. */

import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ItemEntry } from '../types'
import { isItemAvailable } from './availability'

function entry(node: HTMLElement | null, disabled = false): ItemEntry {
  return { id: 'x', ref: { current: node } as React.RefObject<HTMLElement | null>, disabled }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('isItemAvailable', () => {
  it('treats an enabled mounted item as available', () => {
    const el = document.createElement('button')
    document.body.appendChild(el)
    expect(isItemAvailable(entry(el))).toBe(true)
  })

  it('treats an unmounted entry as available so settlement can claim it', () => {
    expect(isItemAvailable(entry(null))).toBe(true)
  })

  it('rejects prop-disabled and natively disabled items', () => {
    const el = document.createElement('button')
    document.body.appendChild(el)
    expect(isItemAvailable(entry(el, true))).toBe(false)
    el.setAttribute('disabled', '')
    expect(isItemAvailable(entry(el))).toBe(false)
    el.removeAttribute('disabled')
    el.setAttribute('aria-disabled', 'true')
    expect(isItemAvailable(entry(el))).toBe(false)
  })

  it('rejects hidden and aria-hidden items', () => {
    const el = document.createElement('button')
    document.body.appendChild(el)
    el.setAttribute('hidden', '')
    expect(isItemAvailable(entry(el))).toBe(false)
    el.removeAttribute('hidden')
    el.setAttribute('aria-hidden', 'true')
    expect(isItemAvailable(entry(el))).toBe(false)
  })

  it('rejects display:none and visibility:hidden items', () => {
    const el = document.createElement('button')
    document.body.appendChild(el)
    el.style.display = 'none'
    expect(isItemAvailable(entry(el))).toBe(false)
    el.style.display = ''
    el.style.visibility = 'hidden'
    expect(isItemAvailable(entry(el))).toBe(false)
  })
})
