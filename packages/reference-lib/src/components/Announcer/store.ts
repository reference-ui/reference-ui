/**
 * Announcer's live-region machine: one AnnouncerStore per Document in a
 * WeakMap, the mounted-document registry that resolves untargeted
 * announce() calls, and the token-guarded clear-then-reinsert writes
 * that make screen readers speak every message — including repeats.
 * announce() is the store's public write action; replayPendingAnnouncements
 * flushes pre-mount speech once the elected host subscribes. Nothing here
 * renders DOM; the host hook owns mounting and election.
 */
import { flushSync } from 'react-dom'
import { announcerDiagnostic } from './shared/warn'
import type { AnnounceOptions, AnnouncerStore } from './types'

export const ANNOUNCE_CLEAR_DELAY = 7000
export const MAX_PENDING_ANNOUNCEMENTS = 50

const announcerStores = new WeakMap<Document, AnnouncerStore>()
const mountedAnnouncerDocuments = new Set<Document>()

export function registerAnnouncerDocument(doc: Document) {
  mountedAnnouncerDocuments.add(doc)
}

export function unregisterAnnouncerDocument(doc: Document) {
  mountedAnnouncerDocuments.delete(doc)
}

export function safeGetGlobalDocument(): Document | undefined {
  try {
    return typeof document !== 'undefined' ? document : undefined
  } catch {
    return undefined
  }
}

export function resolveAnnouncerDocument(explicit?: Document): Document | undefined {
  if (explicit) return explicit
  if (mountedAnnouncerDocuments.size > 1) {
    announcerDiagnostic('announce: ambiguous untargeted call with multiple documents; pass { document }')
    return undefined
  }
  if (mountedAnnouncerDocuments.size === 1) {
    return mountedAnnouncerDocuments.values().next().value
  }
  return safeGetGlobalDocument()
}

function createAnnouncerStore(): AnnouncerStore {
  return {
    politeAnnouncement: '',
    assertiveAnnouncement: '',
    subscribers: new Set(),
    politeTimer: null,
    assertiveTimer: null,
    politeToken: 0,
    assertiveToken: 0,
    pending: [],
    activated: false,
  }
}

export function getAnnouncerStore(doc?: Document): AnnouncerStore {
  const targetDoc = doc ?? safeGetGlobalDocument()
  if (!targetDoc) return createAnnouncerStore()
  let store = announcerStores.get(targetDoc)
  if (!store) {
    store = createAnnouncerStore()
    announcerStores.set(targetDoc, store)
  }
  return store
}

function notifyAnnouncerStore(store: AnnouncerStore, sync = false) {
  const run = () => {
    for (const sub of Array.from(store.subscribers)) {
      try {
        sub()
      } catch {
        // ignore
      }
    }
  }
  if (sync) {
    try {
      flushSync(run)
      return
    } catch {
      // ignore environments without a React flush target
    }
  }
  run()
}

function isBlank(message: string) {
  return message.trim().length === 0
}

function setLiveMessage(
  store: AnnouncerStore,
  politeness: 'polite' | 'assertive',
  message: string,
  options: { recordPending?: boolean; flush?: boolean } = {}
) {
  if (!store.activated && options.recordPending !== false) {
    store.pending.push({ politeness, message })
    if (store.pending.length > MAX_PENDING_ANNOUNCEMENTS) {
      store.pending.shift()
    }
  }
  const tokenKey = politeness === 'assertive' ? 'assertiveToken' : 'politeToken'
  const textKey = politeness === 'assertive' ? 'assertiveAnnouncement' : 'politeAnnouncement'
  const timerKey = politeness === 'assertive' ? 'assertiveTimer' : 'politeTimer'
  const token = store[tokenKey] + 1
  store[tokenKey] = token
  if (store[timerKey]) {
    clearTimeout(store[timerKey]!)
    store[timerKey] = null
  }

  store[textKey] = ''
  notifyAnnouncerStore(store, true)

  queueMicrotask(() => {
    if (store[tokenKey] !== token) return
    store[textKey] = message
    notifyAnnouncerStore(store, true)
    store[timerKey] = setTimeout(() => {
      if (store[tokenKey] !== token) return
      store[textKey] = ''
      store[timerKey] = null
      notifyAnnouncerStore(store, true)
    }, ANNOUNCE_CLEAR_DELAY)
  })
}

export function getAnnouncerSnapshot(doc?: Document) {
  const store = getAnnouncerStore(doc)
  return {
    polite: store.politeAnnouncement,
    assertive: store.assertiveAnnouncement,
    pending: store.pending.map(item => ({ ...item })),
  }
}

export async function replayPendingAnnouncements(store: AnnouncerStore) {
  if (store.activated) return
  store.activated = true
  const queue = store.pending.splice(0)
  if (queue.length === 0) return
  for (const item of queue) {
    if (store.subscribers.size === 0) break
    setLiveMessage(store, item.politeness, item.message, { recordPending: false, flush: true })
    await Promise.resolve()
    await new Promise<void>(resolve => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        return
      }
      resolve()
    })
  }
}

export function announce(message: string, options: AnnounceOptions = {}) {
  if (isBlank(message)) return
  const doc = resolveAnnouncerDocument(options.document)
  if (!doc) return
  const store = getAnnouncerStore(doc)
  const politeness = options.politeness ?? 'polite'
  setLiveMessage(store, politeness, message)
}
