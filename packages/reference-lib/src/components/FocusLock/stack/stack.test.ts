/** Isolation proof for the lock stack: per-document pause chains and pruning. */
import { describe, expect, it } from 'vitest'
import {
  isTopLock,
  locksForDocument,
  registerLock,
  unregisterLock,
  type LockEntry,
} from './stack'

function entry(id: string, doc: object, connected = true): LockEntry {
  return {
    id,
    container: { isConnected: connected, ownerDocument: doc } as unknown as HTMLElement,
    shards: () => [],
    lastFocusedNode: { current: null },
  }
}

describe('lock stack', () => {
  it('keeps last-active on top within one document', () => {
    const doc = {}
    registerLock(entry('a1', doc))
    registerLock(entry('a2', doc))
    try {
      expect(locksForDocument(doc as unknown as Document).map(lock => lock.id)).toEqual([
        'a1',
        'a2',
      ])
      expect(isTopLock('a2', doc as unknown as Document)).toBe(true)
      expect(isTopLock('a1', doc as unknown as Document)).toBe(false)
    } finally {
      unregisterLock('a1')
      unregisterLock('a2')
    }
  })

  it('does not let one document pause another', () => {
    const docA = {}
    const docB = {}
    registerLock(entry('a', docA))
    registerLock(entry('b', docB))
    try {
      expect(isTopLock('a', docA as unknown as Document)).toBe(true)
      expect(isTopLock('b', docB as unknown as Document)).toBe(true)
      expect(locksForDocument(docA as unknown as Document).map(lock => lock.id)).toEqual(['a'])
    } finally {
      unregisterLock('a')
      unregisterLock('b')
    }
  })

  it('prunes detached containers on read and resumes the survivor', () => {
    const doc = {}
    const survivor = entry('survivor', doc)
    const gone = entry('gone', doc)
    registerLock(survivor)
    registerLock(gone)
    ;(gone.container as unknown as { isConnected: boolean }).isConnected = false
    try {
      expect(locksForDocument(doc as unknown as Document).map(lock => lock.id)).toEqual([
        'survivor',
      ])
      expect(isTopLock('survivor', doc as unknown as Document)).toBe(true)
    } finally {
      unregisterLock('survivor')
      unregisterLock('gone')
    }
  })

  it('ignores unknown unregistrations', () => {
    expect(() => unregisterLock('never-registered')).not.toThrow()
  })
})
