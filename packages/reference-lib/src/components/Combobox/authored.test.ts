import * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  isGridAdapter,
  isWindowedListAdapter,
  scanAuthoredCollections,
  scanHasPopoverContent,
  type AuthoredCollectionRefs,
} from './authored'

const Popover = () => null
const ComboboxOption = () => null
const ListboxOption = () => null
const VirtualItem = () => null
const Listbox = () => null
const Tree = () => null
const TreeItem = () => null
const Empty = () => null

const refs: AuthoredCollectionRefs = {
  Popover,
  ComboboxOption,
  ListboxOption,
  VirtualItem,
  Listbox,
  Tree,
  TreeItem,
  Empty,
}

const gridAdapter = {
  role: 'grid',
  items: [{ value: 'a', textValue: 'A' }],
  getNextIndex: () => null,
  scrollToIndex: () => {},
}

describe('scanAuthoredCollections', () => {
  it('finds popover content through authored items', () => {
    const scan = scanAuthoredCollections(
      React.createElement(
        Popover,
        null,
        React.createElement(Listbox, null, React.createElement(ListboxOption, { value: 'a' }))
      ),
      refs,
      true
    )
    expect(scan.popovers).toHaveLength(1)
    expect(scan.authoredItemCount).toBe(1)
    expect(scan.collectionKinds).toEqual(['listbox'])
    expect(scanHasPopoverContent(scan)).toBe(true)
  })

  it('reads adapter metadata and flags nested authorities', () => {
    const scan = scanAuthoredCollections(
      React.createElement(
        Popover,
        { virtualFocus: gridAdapter },
        React.createElement(Listbox, { onChange: () => {}, selection: 'multiple' })
      ),
      refs,
      true
    )
    expect(scan.virtualFocusAdapter).toBe(gridAdapter)
    expect(scan.metadataItemCount).toBe(1)
    expect(scan.nestedOnChangeKind).toBe('listbox')
    expect(scan.multipleListbox).toBe(true)
    expect(scanHasPopoverContent(scan)).toBe(true)
  })

  it('gates content on popovers and logical items', () => {
    const empty = scanAuthoredCollections(
      React.createElement(Popover, null, React.createElement(Empty)),
      refs,
      true
    )
    expect(empty.emptyAuthored).toBe(true)
    expect(scanHasPopoverContent(empty)).toBe(false)
    expect(scanHasPopoverContent(scanAuthoredCollections(null, refs, true))).toBe(false)
  })
})

describe('adapter shape guards', () => {
  it('accepts grid adapters and rejects near-misses', () => {
    expect(isGridAdapter(gridAdapter)).toBe(true)
    expect(isGridAdapter({ ...gridAdapter, role: 'listbox' })).toBe(false)
    expect(isGridAdapter({ ...gridAdapter, getNextIndex: null })).toBe(false)
    expect(isGridAdapter(null)).toBe(false)
    expect(isGridAdapter('grid')).toBe(false)
  })

  it('accepts windowed list adapters and rejects near-misses', () => {
    const windowed = { items: [], scrollToIndex: () => {} }
    expect(isWindowedListAdapter(windowed)).toBe(true)
    expect(isWindowedListAdapter(gridAdapter)).toBe(true)
    expect(isWindowedListAdapter({ items: [] })).toBe(false)
    expect(isWindowedListAdapter(null)).toBe(false)
  })
})
