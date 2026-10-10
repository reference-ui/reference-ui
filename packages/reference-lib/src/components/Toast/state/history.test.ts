/** Isolation proof for history: live snapshots and in-place dismissal stamps. */
import { describe, expect, it } from 'vitest'
import { rememberHistory, snapshotToasts } from './history'
import type { ToastItem } from '../types'
import type { ToastRuntimeStore } from './store'

function item(extra?: Partial<ToastItem>): ToastItem {
  return { id: 'x', generation: 1, createdAt: 0, dismissible: true, ...extra } as ToastItem
}

function storeWith(toasts: ToastItem[]): ToastRuntimeStore {
  return { toasts, history: [] } as unknown as ToastRuntimeStore
}

describe('toast history', () => {
  it('snapshots live records and skips exiting ones', () => {
    const store = storeWith([
      item({ id: 'a', type: 'success', position: 'bottom-end', createdAt: 10 }),
      item({ id: 'b', type: 'info', position: 'top-start', createdAt: 20, exiting: true }),
    ])
    expect(snapshotToasts(store)).toEqual([
      { id: 'a', type: 'success', position: 'bottom-end', createdAt: 10, updatedAt: 10 },
    ])
  })

  it('updates the open record in place and stamps dismissal once', () => {
    const store = storeWith([])
    const loading = item({ id: 'a', type: 'loading', position: 'bottom-end', createdAt: 10 })
    rememberHistory(store, loading)
    rememberHistory(store, { ...loading, type: 'success' })
    expect(store.history).toHaveLength(1)
    expect(store.history[0]?.type).toBe('success')
    expect(store.history[0]?.dismissedAt).toBeUndefined()
    rememberHistory(store, { ...loading, type: 'success' }, 99)
    expect(store.history).toHaveLength(1)
    expect(store.history[0]?.dismissedAt).toBe(99)
  })
})
