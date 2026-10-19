/**
 * Proof for the document host election. Pins first-live-mount wins with
 * later mounts on standby, failover to the earliest remaining mount,
 * per-document independence, and remounted former hosts staying standby.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLibraryStore, registerHost, subscribeHost, unregisterHost } from './store'

describe('host election', () => {
  const mounted: Array<{ id: string; doc: Document }> = []
  let idCounter = 0

  function mount(doc: Document, update = () => {}): string {
    idCounter += 1
    const id = `test-host-${idCounter}`
    registerHost(id, doc, update)
    mounted.push({ id, doc })
    return id
  }

  afterEach(() => {
    while (mounted.length > 0) {
      const { id, doc } = mounted.pop()!
      unregisterHost(id, doc)
    }
  })

  it('elects the first live mount and holds later mounts on standby', () => {
    const doc = {} as Document
    const a = mount(doc)
    const b = mount(doc)

    expect(getLibraryStore(doc).activeHostId).toBe(a)
    expect(getLibraryStore(doc).activeHostId).not.toBe(b)
  })

  it('fails over to the earliest remaining mount when the host unmounts', () => {
    const doc = {} as Document
    const updateB = vi.fn()
    const updateC = vi.fn()
    const a = mount(doc)
    const b = mount(doc, updateB)
    mount(doc, updateC)
    updateB.mockClear()
    updateC.mockClear()

    unregisterHost(a, doc)

    expect(getLibraryStore(doc).activeHostId).toBe(b)
    expect(updateB).toHaveBeenCalledTimes(1)
    expect(updateC).not.toHaveBeenCalled()
  })

  it('keeps the election when a standby unmounts', () => {
    const doc = {} as Document
    const updateA = vi.fn()
    const a = mount(doc, updateA)
    const b = mount(doc)
    updateA.mockClear()

    unregisterHost(b, doc)

    expect(getLibraryStore(doc).activeHostId).toBe(a)
    expect(updateA).not.toHaveBeenCalled()
  })

  it('elects independently per document', () => {
    const docA = {} as Document
    const docB = {} as Document
    const a = mount(docA)
    const b = mount(docB)

    expect(getLibraryStore(docA).activeHostId).toBe(a)
    expect(getLibraryStore(docB).activeHostId).toBe(b)

    unregisterHost(a, docA)
    expect(getLibraryStore(docA).activeHostId).toBe(null)
    expect(getLibraryStore(docB).activeHostId).toBe(b)
  })

  it('holds a remounted former host on standby behind the live successor', () => {
    const doc = {} as Document
    const a = mount(doc)
    const b = mount(doc)
    unregisterHost(a, doc)
    mounted.splice(mounted.findIndex(m => m.id === a), 1)

    const a2 = mount(doc)

    expect(getLibraryStore(doc).activeHostId).toBe(b)
    expect(a2).not.toBe(b)
  })

  it('repairs a stale election when the recorded host is gone', () => {
    const doc = {} as Document
    const store = getLibraryStore(doc)
    store.activeHostId = 'ghost-host'
    const a = mount(doc)

    expect(getLibraryStore(doc).activeHostId).toBe(a)
  })

  it('notifies every same-document mount on registration', () => {
    const doc = {} as Document
    const updateA = vi.fn()
    mount(doc, updateA)
    updateA.mockClear()

    mount(doc)

    expect(updateA).toHaveBeenCalledTimes(1)
  })

  it('memoizes one store per document', () => {
    const doc = {} as Document
    expect(getLibraryStore(doc)).toBe(getLibraryStore(doc))
  })

  it('subscribes and unsubscribes listeners', () => {
    const doc = {} as Document
    const store = getLibraryStore(doc)
    const listener = vi.fn()

    const unsubscribe = subscribeHost(store, listener)
    expect(store.subscribers.has(listener)).toBe(true)
    unsubscribe()
    expect(store.subscribers.has(listener)).toBe(false)
  })
})
