import * as React from 'react'
import { flushSync } from 'react-dom'

export const ANNOUNCE_CLEAR_DELAY = 7000

export interface AnnounceOptions {
  politeness?: 'polite' | 'assertive'
  document?: Document
}

interface PendingAnnouncement {
  politeness: 'polite' | 'assertive'
  message: string
}

interface AnnouncerStore {
  politeAnnouncement: string
  assertiveAnnouncement: string
  subscribers: Set<() => void>
  politeTimer: ReturnType<typeof setTimeout> | null
  assertiveTimer: ReturnType<typeof setTimeout> | null
  politeToken: number
  assertiveToken: number
  pending: PendingAnnouncement[]
  activated: boolean
}

const announcerStores = new WeakMap<Document, AnnouncerStore>()

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

function getAnnouncerStore(doc?: Document): AnnouncerStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
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
  notifyAnnouncerStore(store, options.flush)

  queueMicrotask(() => {
    if (store[tokenKey] !== token) return
    store[textKey] = message
    notifyAnnouncerStore(store, options.flush)
    store[timerKey] = setTimeout(() => {
      if (store[tokenKey] !== token) return
      store[textKey] = ''
      store[timerKey] = null
      notifyAnnouncerStore(store)
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

async function replayPendingAnnouncements(store: AnnouncerStore) {
  if (store.activated) return
  store.activated = true
  const queue = store.pending.splice(0)
  if (queue.length === 0) return
  for (const item of queue) {
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
  const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
  if (!doc) return
  const store = getAnnouncerStore(doc)
  const politeness = options.politeness ?? 'polite'
  setLiveMessage(store, politeness, message)
}

export function AnnouncerHost() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const store = typeof document !== 'undefined' ? getAnnouncerStore(document) : null

  React.useLayoutEffect(() => {
    if (!store) return
    const onStoreChange = () => forceUpdate()
    store.subscribers.add(onStoreChange)
    void replayPendingAnnouncements(store)
    return () => {
      store.subscribers.delete(onStoreChange)
    }
  }, [store])

  if (!store) return null

  return (
    <div
      data-reference-announcer-host=""
      data-reference-overlay-ignore=""
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      <div role="status" aria-live="polite" data-testid="polite-announcer">
        {store.politeAnnouncement}
      </div>
      <div role="alert" aria-live="assertive" data-testid="assertive-announcer">
        {store.assertiveAnnouncement}
      </div>
    </div>
  )
}
