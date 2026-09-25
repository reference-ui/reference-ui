import * as React from 'react'
import { flushSync } from 'react-dom'

export const ANNOUNCE_CLEAR_DELAY = 7000
export const MAX_PENDING_ANNOUNCEMENTS = 50

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
const mountedAnnouncerDocuments = new Set<Document>()
const activePrimaryHosts = new WeakMap<Document, string>()

export function registerAnnouncerDocument(doc: Document) {
  mountedAnnouncerDocuments.add(doc)
}

export function unregisterAnnouncerDocument(doc: Document) {
  mountedAnnouncerDocuments.delete(doc)
}

function safeGetGlobalDocument(): Document | undefined {
  try {
    return typeof document !== 'undefined' ? document : undefined
  } catch {
    return undefined
  }
}

export function announcerDiagnostic(message: string) {
  console.warn(`[reference-ui] ${message}`)
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

async function replayPendingAnnouncements(store: AnnouncerStore) {
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

const HOST_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export function AnnouncerHost({ document: docProp }: { document?: Document } = {}) {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const hostId = React.useId()
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const resolvedDoc = docProp ?? safeGetGlobalDocument()
  const docRef = React.useRef<Document | undefined>(resolvedDoc)
  const isPrimaryRef = React.useRef<boolean>(false)

  React.useLayoutEffect(() => {
    const doc = docProp ?? hostRef.current?.ownerDocument ?? safeGetGlobalDocument()
    if (!doc) return
    docRef.current = doc

    const currentPrimary = activePrimaryHosts.get(doc)
    if (!currentPrimary) {
      activePrimaryHosts.set(doc, hostId)
      isPrimaryRef.current = true
    } else if (currentPrimary === hostId) {
      isPrimaryRef.current = true
    } else {
      isPrimaryRef.current = false
      return
    }

    registerAnnouncerDocument(doc)
    const store = getAnnouncerStore(doc)
    const onStoreChange = () => forceUpdate()
    store.subscribers.add(onStoreChange)

    void replayPendingAnnouncements(store)

    return () => {
      if (isPrimaryRef.current) {
        if (activePrimaryHosts.get(doc) === hostId) {
          activePrimaryHosts.delete(doc)
        }
        isPrimaryRef.current = false
      }
      store.subscribers.delete(onStoreChange)
      unregisterAnnouncerDocument(doc)
      if (store.subscribers.size === 0) {
        store.activated = false
        store.politeAnnouncement = ''
        store.assertiveAnnouncement = ''
      }
    }
  }, [docProp, hostId])

  const targetDoc = docRef.current
  if (!targetDoc) return null

  const currentPrimary = activePrimaryHosts.get(targetDoc)
  if (currentPrimary && currentPrimary !== hostId) {
    return null
  }

  const store = getAnnouncerStore(targetDoc)

  return (
    <div
      ref={hostRef}
      data-reference-announcer-host=""
      data-reference-overlay-ignore=""
      style={HOST_STYLE}
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-reference-announcer="polite"
        data-testid="polite-announcer"
      >
        {store.politeAnnouncement}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-reference-announcer="assertive"
        data-testid="assertive-announcer"
      >
        {store.assertiveAnnouncement}
      </div>
    </div>
  )
}
