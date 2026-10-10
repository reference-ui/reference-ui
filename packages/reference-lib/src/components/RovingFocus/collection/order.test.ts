// @vitest-environment happy-dom
/** Isolated proof for collection/order: entries sort by live document
 * position and disconnected entries drop out, so keyed insert, reorder, and
 * removal (RF-DOM-04) are observed through geometry rather than
 * registration order. */

import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ItemEntry } from '../types'
import { orderEntriesByDom } from './order'

function entry(id: string, node: HTMLElement | null): ItemEntry {
  return { id, ref: { current: node } as React.RefObject<HTMLElement | null>, disabled: false }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('orderEntriesByDom (RF-DOM-04)', () => {
  it('sorts entries by document position regardless of input order', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const a = document.createElement('button')
    const b = document.createElement('button')
    const c = document.createElement('button')
    container.append(a, b, c)
    const ordered = orderEntriesByDom([entry('c', c), entry('a', a), entry('b', b)])
    expect(ordered.map(e => e.id)).toEqual(['a', 'b', 'c'])
  })

  it('follows keyed reorder through live node moves', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const a = document.createElement('button')
    const b = document.createElement('button')
    container.append(a, b)
    container.appendChild(a)
    const ordered = orderEntriesByDom([entry('a', a), entry('b', b)])
    expect(ordered.map(e => e.id)).toEqual(['b', 'a'])
  })

  it('drops disconnected entries', () => {
    const live = document.createElement('button')
    document.body.appendChild(live)
    const detached = document.createElement('button')
    const ordered = orderEntriesByDom([entry('detached', detached), entry('live', live)])
    expect(ordered.map(e => e.id)).toEqual(['live'])
  })
})
