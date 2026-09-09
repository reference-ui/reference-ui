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
  generation: number
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

export interface ToastRuntimeStore {
  subscribers: Set<() => void>
  toasts: ToastItem[]
  history: ToastHistoryRecord[]
  defaults: ToastRuntimeDefaults
  lastGeneration: Map<string, number>
}

const TOAST_RUNTIME_KEY = '__referenceToastRuntime__'
const mountedToastDocuments = new Set<Document>()

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

export function toastDiagnostic(message: string) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn(`[reference-ui] ${message}`)
  }
}

export function registerToastDocument(doc: Document) {
  mountedToastDocuments.add(doc)
}

export function unregisterToastDocument(doc: Document) {
  mountedToastDocuments.delete(doc)
}

export function resolveToastDocument(explicit?: Document): Document | undefined {
  if (explicit) return explicit
  if (mountedToastDocuments.size > 1) {
    toastDiagnostic('toast: ambiguous untargeted call with multiple documents; pass { document }')
    return undefined
  }
  if (typeof document !== 'undefined') return document
  return undefined
}

export function generateToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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

function activeItem(store: ToastRuntimeStore, id: string) {
  return store.toasts.find(item => tMatches(item, id) && !item.exiting)
}

function tMatches(item: ToastItem, id: string) {
  return item.id === id
}

function nextGeneration(store: ToastRuntimeStore, id: string) {
  const generation = (store.lastGeneration.get(id) ?? 0) + 1
  store.lastGeneration.set(id, generation)
  return generation
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

function resolveShowId(options: ReferenceToastOptions) {
  return options.id !== undefined ? options.id : generateToastId()
}

function resolveDuration(
  options: ReferenceToastOptions,
  previous: ToastItem | undefined,
  defaults: ToastRuntimeDefaults
) {
  if (options.duration !== undefined) return options.duration
  if (previous) return previous.duration
  return defaults.duration
}

function resolvePosition(
  options: ReferenceToastOptions,
  previous: ToastItem | undefined,
  defaults: ToastRuntimeDefaults
) {
  if (options.position !== undefined) return options.position
  if (previous) return previous.position
  return defaults.position
}

function resolveContent(
  content: React.ReactNode | ((id: string) => React.ReactNode) | undefined,
  options: ReferenceToastOptions,
  previous?: ToastItem
) {
  if (content !== undefined) return content
  if (options.title !== undefined) return undefined
  return previous?.content
}

export function peekToastGeneration(id: string, doc?: Document) {
  const store = getToastStore(doc)
  const current = activeItem(store, id)
  if (current) return current.generation
  return (store.lastGeneration.get(id) ?? 0) + 1
}

export const referenceToast = {
  show(content: React.ReactNode | ((id: string) => React.ReactNode) | undefined, options: ReferenceToastOptions = {}) {
    const id = resolveShowId(options)
    const doc = resolveToastDocument(options.document)
    if (!doc) {
      if (options.document === undefined && mountedToastDocuments.size <= 1) {
        toastDiagnostic(`toast.show is a no-op without a document (id "${id}")`)
      }
      return id
    }

    const store = getToastStore(doc)
    const existingIndex = store.toasts.findIndex(t => t.id === id)
    const existing = existingIndex !== -1 ? store.toasts[existingIndex] : undefined
    const inPlace = Boolean(existing && !existing.exiting)
    const previous = inPlace ? existing : undefined
    const duration = resolveDuration(options, previous, store.defaults)
    const position = resolvePosition(options, previous, store.defaults)
    const dismissible = options.dismissible ?? previous?.dismissible ?? true
    const generation = inPlace ? existing!.generation : nextGeneration(store, id)
    const durationChanged = previous ? previous.duration !== duration : true
    const item: ToastItem = {
      id,
      generation,
      content: resolveContent(content, options, previous),
      duration,
      position,
      createdAt: inPlace && !durationChanged ? previous!.createdAt : Date.now(),
      remaining: durationChanged ? (duration === false ? false : duration) : previous!.remaining,
      dismissible,
      onAutoClose: options.onAutoClose ?? previous?.onAutoClose,
      onDismiss: options.onDismiss ?? previous?.onDismiss,
      type: options.type ?? previous?.type,
      testId: options.testId ?? previous?.testId,
      invert: options.invert ?? previous?.invert,
      richColors: options.richColors ?? previous?.richColors,
      swipeDirections: options.swipeDirections ?? previous?.swipeDirections,
      ...chromeFrom(options, previous),
    }

    if (existingIndex !== -1) {
      store.toasts[existingIndex] = item
      rememberHistory(store, item)
    } else {
      store.toasts.push(item)
      rememberHistory(store, item)
    }

    notifyStore(store)
    return id
  },

  update(
    id: string,
    content: React.ReactNode | ((id: string) => React.ReactNode) | undefined,
    options: ReferenceToastOptions = {}
  ) {
    const doc = resolveToastDocument(options.document)
    if (!doc) {
      toastDiagnostic(`toast.update is a no-op without a document (id "${id}")`)
      return
    }
    const store = getToastStore(doc)
    if (!activeItem(store, id)) {
      toastDiagnostic(`toast.update: unknown id "${id}"`)
      return
    }
    referenceToast.show(content, { ...options, id, document: doc })
  },

  dismiss(
    id: string,
    options: { document?: Document; reason?: ToastDismissReason; generation?: number } = {}
  ) {
    const doc = resolveToastDocument(options.document)
    if (!doc) {
      toastDiagnostic(`toast.dismiss is a no-op without a document (id "${id}")`)
      return
    }
    const store = getToastStore(doc)
    const item = store.toasts.find(t => t.id === id)
    if (!item || item.exiting) return
    if (options.generation != null && item.generation !== options.generation) return
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

  remove(id: string, options: { document?: Document; generation?: number } = {}) {
    const doc = resolveToastDocument(options.document)
    if (!doc) return
    const store = getToastStore(doc)
    const item = store.toasts.find(t => t.id === id)
    if (!item) return
    if (options.generation != null && item.generation !== options.generation) return
    store.toasts = store.toasts.filter(t => t.id !== id)
    notifyStore(store)
  },

  dismissAll(options: { document?: Document } = {}) {
    const doc = resolveToastDocument(options.document)
    if (!doc) {
      toastDiagnostic('toast.dismissAll is a no-op without a document')
      return
    }
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
    const resolved = resolveToastDocument(doc)
    if (!resolved && doc === undefined && mountedToastDocuments.size > 1) return []
    return snapshotToasts(getToastStore(resolved))
  },

  getHistory(doc?: Document): ToastHistoryRecord[] {
    const resolved = resolveToastDocument(doc)
    if (!resolved && doc === undefined && mountedToastDocuments.size > 1) return []
    return getToastStore(resolved).history.map(record => ({ ...record }))
  },
}

export type { ToastType } from './toastContext'
