/**
 * Toast stores: one subscriber-notified record list per document, keyed on
 * the document itself so parallel documents (tests, portals, iframes) never
 * share queue state. Holds the mutable defaults (duration, position, limit)
 * the host publishes and the last-generation map that makes stale closes
 * and removes miss recreated IDs. Documents without a DOM get an ephemeral
 * store that callers can still read.
 */
import type { ToastHistoryRecord, ToastItem } from '../types'
import {
  LIBRARY_TOAST_DURATION,
  LIBRARY_TOAST_LIMIT,
  LIBRARY_TOAST_POSITION,
} from '../toastQueue'

interface ToastRuntimeDefaults {
  duration: number | false
  position: string
  limit: number
}

export interface ToastRuntimeStore {
  subscribers: Set<() => void>
  toasts: ToastItem[]
  history: ToastHistoryRecord[]
  defaults: ToastRuntimeDefaults
  lastGeneration: Map<string, number>
}

const TOAST_RUNTIME_KEY = '__referenceToastRuntime__'

function createToastStore(): ToastRuntimeStore {
  return {
    subscribers: new Set(),
    toasts: [],
    history: [],
    lastGeneration: new Map(),
    defaults: {
      duration: LIBRARY_TOAST_DURATION,
      position: LIBRARY_TOAST_POSITION,
      limit: LIBRARY_TOAST_LIMIT,
    },
  }
}

export function getToastStore(doc?: Document): ToastRuntimeStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) {
    return createToastStore()
  }

  const holder = targetDoc as Document & { [TOAST_RUNTIME_KEY]?: ToastRuntimeStore }
  let store = holder[TOAST_RUNTIME_KEY]
  if (!store) {
    store = createToastStore()
    holder[TOAST_RUNTIME_KEY] = store
  }
  return store
}

export function setToastDefaults(
  defaults: Partial<ToastRuntimeDefaults>,
  doc?: Document
): void {
  const store = getToastStore(doc)
  store.defaults = { ...store.defaults, ...defaults }
}
