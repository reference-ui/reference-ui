/**
 * Toast history: the capped audit log behind getHistory. Open records
 * update in place on every show so one row tracks a toast's whole life;
 * dismiss stamps dismissedAt; overflow trims oldest-first at the cap.
 * snapshotToasts separately projects the live queue for getToasts.
 */
import type { ToastHistoryRecord, ToastItem } from '../types'
import type { ToastRuntimeStore } from './store'
import { TOAST_HISTORY_LIMIT } from '../toastQueue'

export function rememberHistory(store: ToastRuntimeStore, item: ToastItem, dismissedAt?: number) {
  const existing = store.history.find(record => record.id === item.id && !record.dismissedAt)
  if (existing) {
    existing.type = item.type
    existing.position = item.position
    existing.updatedAt = Date.now()
    if (dismissedAt) existing.dismissedAt = dismissedAt
  } else {
    store.history.push({
      id: item.id,
      type: item.type,
      position: item.position,
      createdAt: item.createdAt,
      updatedAt: Date.now(),
      dismissedAt,
    })
  }
  if (store.history.length > TOAST_HISTORY_LIMIT) {
    store.history.splice(0, store.history.length - TOAST_HISTORY_LIMIT)
  }
}

export function snapshotToasts(store: ToastRuntimeStore): ToastHistoryRecord[] {
  return store.toasts.filter(item => !item.exiting).map(item => ({
    id: item.id,
    type: item.type,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  }))
}
