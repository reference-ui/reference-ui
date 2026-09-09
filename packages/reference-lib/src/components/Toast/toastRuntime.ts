import type * as React from 'react'
import {
  LIBRARY_TOAST_DURATION,
  LIBRARY_TOAST_LIMIT,
  LIBRARY_TOAST_POSITION,
  TOAST_HISTORY_LIMIT,
} from './toastQueue'
import type { ToastAction } from './toastContext'
import type { ToastClassNames } from './toastContext'

export type ToastDismissReason = 'auto' | 'manual'

export interface ToastHistoryRecord {
  id: string
  type?: string
  position?: string
  createdAt: number
  updatedAt: number
  dismissedAt?: number
}

export interface ToastItem {
  id: string
  content?: React.ReactNode | ((id: string) => React.ReactNode)
  title?: React.ReactNode
  description?: React.ReactNode
  duration?: number | false
  position?: string
  createdAt: number
  remaining?: number | false
  dismissible: boolean
  onAutoClose?: (id: string) => void
  onDismiss?: (id: string) => void
  type?: string
  testId?: string
  invert?: boolean
  richColors?: boolean
  swipeDirections?: readonly string[]
  exiting?: boolean
  closeButton?: boolean
  action?: ToastAction
  cancel?: ToastAction
  icon?: React.ReactNode
  unstyled?: boolean
  className?: string
  style?: React.CSSProperties
  classNames?: ToastClassNames
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
}

export interface ReferenceToastOptions {
  id?: string
  duration?: number | false
  position?: string
  document?: Document
  dismissible?: boolean
  onAutoClose?: (id: string) => void
  onDismiss?: (id: string) => void
  type?: string
  testId?: string
  invert?: boolean
  richColors?: boolean
  swipeDirections?: readonly string[]
  title?: React.ReactNode
  description?: React.ReactNode
  closeButton?: boolean
  action?: ToastAction
  cancel?: ToastAction
  icon?: React.ReactNode
  unstyled?: boolean
  className?: string
  style?: React.CSSProperties
  classNames?: ToastClassNames
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
}

interface ToastRuntimeDefaults {
  duration: number | false
  position: string
  limit: number
}

interface ToastRuntimeStore {
  subscribers: Set<() => void>
  toasts: ToastItem[]
  history: ToastHistoryRecord[]
  defaults: ToastRuntimeDefaults
}

const TOAST_RUNTIME_KEY = '__referenceToastRuntime__'

function createToastStore(): ToastRuntimeStore {
  return {
    subscribers: new Set(),
    toasts: [],
    history: [],
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

function notifyStore(store: ToastRuntimeStore) {
  for (const sub of Array.from(store.subscribers)) {
    try {
      sub()
    } catch {
      // ignore
    }
  }
}

function rememberHistory(store: ToastRuntimeStore, item: ToastItem, dismissedAt?: number) {
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

function isMountedVisible(store: ToastRuntimeStore, id: string): boolean {
  const active = store.toasts.filter(item => !item.exiting)
  const index = active.findIndex(item => item.id === id)
  return index >= 0 && index < store.defaults.limit
}

function chromeFrom(
  options: ReferenceToastOptions,
  previous?: ToastItem
): Pick<
  ToastItem,
  | 'title'
  | 'description'
  | 'closeButton'
  | 'action'
  | 'cancel'
  | 'icon'
  | 'unstyled'
  | 'className'
  | 'style'
  | 'classNames'
  | 'actionButtonStyle'
  | 'cancelButtonStyle'
> {
  return {
    title: options.title ?? previous?.title,
    description: options.description ?? previous?.description,
    closeButton: options.closeButton ?? previous?.closeButton,
    action: options.action ?? previous?.action,
    cancel: options.cancel ?? previous?.cancel,
    icon: options.icon ?? previous?.icon,
    unstyled: options.unstyled ?? previous?.unstyled,
    className: options.className ?? previous?.className,
    style: options.style ?? previous?.style,
    classNames: options.classNames ?? previous?.classNames,
    actionButtonStyle: options.actionButtonStyle ?? previous?.actionButtonStyle,
    cancelButtonStyle: options.cancelButtonStyle ?? previous?.cancelButtonStyle,
  }
}

export const referenceToast = {
  show(content: React.ReactNode | ((id: string) => React.ReactNode) | undefined, options: ReferenceToastOptions = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
    const id = options.id ?? `toast-${Date.now()}-${Math.random()}`
    const duration = options.duration ?? store.defaults.duration
    const position = options.position ?? store.defaults.position
    const dismissible = options.dismissible ?? true

    const existingIndex = store.toasts.findIndex(t => t.id === id)
    const previous = existingIndex !== -1 ? store.toasts[existingIndex] : undefined
    const item: ToastItem = {
      id,
      content,
      duration,
      position,
      createdAt: Date.now(),
      remaining: duration === false ? false : duration,
      dismissible,
      onAutoClose: options.onAutoClose,
      onDismiss: options.onDismiss,
      type: options.type,
      testId: options.testId,
      invert: options.invert,
      richColors: options.richColors,
      swipeDirections: options.swipeDirections,
      ...chromeFrom(options, previous),
    }

    if (existingIndex !== -1) {
      const durationChanged = previous!.duration !== duration
      store.toasts[existingIndex] = {
        ...item,
        onAutoClose: options.onAutoClose ?? previous!.onAutoClose,
        onDismiss: options.onDismiss ?? previous!.onDismiss,
        type: options.type ?? previous!.type,
        testId: options.testId ?? previous!.testId,
        invert: options.invert ?? previous!.invert,
        richColors: options.richColors ?? previous!.richColors,
        swipeDirections: options.swipeDirections ?? previous!.swipeDirections,
        remaining: durationChanged ? item.remaining : previous!.remaining,
        createdAt: durationChanged ? item.createdAt : previous!.createdAt,
        exiting: false,
      }
      rememberHistory(store, store.toasts[existingIndex]!)
    } else {
      store.toasts.push(item)
      rememberHistory(store, item)
    }

    notifyStore(store)
    return id
  },

  dismiss(
    id: string,
    options: { document?: Document; reason?: ToastDismissReason } = {}
  ) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
    const item = store.toasts.find(t => t.id === id)
    if (!item || item.exiting) return
    if (options.reason === 'auto') {
      item.onAutoClose?.(id)
    } else {
      item.onDismiss?.(id)
    }
    rememberHistory(store, item, Date.now())
    if (isMountedVisible(store, id) && store.subscribers.size > 0) {
      item.exiting = true
    } else {
      store.toasts = store.toasts.filter(t => t.id !== id)
    }
    notifyStore(store)
  },

  remove(id: string, options: { document?: Document } = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
    const next = store.toasts.filter(t => t.id !== id)
    if (next.length === store.toasts.length) return
    store.toasts = next
    notifyStore(store)
  },

  dismissAll(options: { document?: Document } = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
    const now = Date.now()
    const visibleIds = new Set(
      store.toasts.filter(item => !item.exiting).slice(0, store.defaults.limit).map(item => item.id)
    )
    for (const item of store.toasts) {
      if (item.exiting) continue
      item.onDismiss?.(item.id)
      rememberHistory(store, item, now)
      if (visibleIds.has(item.id) && store.subscribers.size > 0) {
        item.exiting = true
      }
    }
    store.toasts = store.subscribers.size > 0 ? store.toasts.filter(item => item.exiting) : []
    notifyStore(store)
  },

  getToasts(doc?: Document): ToastHistoryRecord[] {
    return snapshotToasts(getToastStore(doc))
  },

  getHistory(doc?: Document): ToastHistoryRecord[] {
    return getToastStore(doc).history.map(record => ({ ...record }))
  },
}

export type { ToastType } from './toastContext'
