/**
 * Toast record core: show, update, dismiss, remove, and dismissAll mutate
 * the per-document store while the option resolvers layer invocation over
 * previous over library defaults. Same-ID shows upsert in place without
 * resetting untouched timers; dismiss flips visible records to exiting so
 * the host can animate them out; generations make stale closes miss. The
 * public toast API and defined toasts are thin callers over this object.
 */
import type * as React from 'react'
import type { ReferenceToastOptions, ToastDismissReason, ToastHistoryRecord, ToastItem } from '../types'
import { getToastStore, type ToastRuntimeStore } from './store'
import { mountedToastDocumentCount, resolveToastDocument } from './documents'
import { rememberHistory, snapshotToasts } from './history'
import { generateToastId } from '../shared/ids'
import { toastDiagnostic } from '../shared/diagnostic'

function notifyStore(store: ToastRuntimeStore) {
  for (const sub of Array.from(store.subscribers)) {
    try {
      sub()
    } catch {
      // ignore
    }
  }
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
  defaults: ToastRuntimeStore['defaults']
) {
  if (options.duration !== undefined) return options.duration
  if (previous) return previous.duration
  return defaults.duration
}

function resolvePosition(
  options: ReferenceToastOptions,
  previous: ToastItem | undefined,
  defaults: ToastRuntimeStore['defaults']
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
      if (options.document === undefined && mountedToastDocumentCount() <= 1) {
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
    if (!resolved && doc === undefined && mountedToastDocumentCount() > 1) return []
    return snapshotToasts(getToastStore(resolved))
  },

  getHistory(doc?: Document): ToastHistoryRecord[] {
    const resolved = resolveToastDocument(doc)
    if (!resolved && doc === undefined && mountedToastDocumentCount() > 1) return []
    return getToastStore(resolved).history.map(record => ({ ...record }))
  },
}
