import * as React from 'react'
import { Div } from '@reference-ui/react'

export interface AnnounceOptions {
  politeness?: 'polite' | 'assertive'
  document?: Document
}

interface AnnouncerStore {
  politeAnnouncement: string | null
  assertiveAnnouncement: string | null
  subscribers: Set<() => void>
}

const announcerStores = new WeakMap<Document, AnnouncerStore>()

function getAnnouncerStore(doc?: Document): AnnouncerStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) return { politeAnnouncement: null, assertiveAnnouncement: null, subscribers: new Set() }
  let store = announcerStores.get(targetDoc)
  if (!store) {
    store = { politeAnnouncement: null, assertiveAnnouncement: null, subscribers: new Set() }
    announcerStores.set(targetDoc, store)
  }
  return store
}

function notifyAnnouncerStore(store: AnnouncerStore) {
  for (const sub of Array.from(store.subscribers)) {
    try { sub() } catch {}
  }
}

export function announce(message: string, options: AnnounceOptions = {}) {
  const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
  const store = getAnnouncerStore(doc)
  const politeness = options.politeness ?? 'polite'

  if (politeness === 'assertive') {
    store.assertiveAnnouncement = message
  } else {
    store.politeAnnouncement = message
  }

  notifyAnnouncerStore(store)
}

export function AnnouncerHost() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const store = typeof document !== 'undefined' ? getAnnouncerStore(document) : null

  React.useLayoutEffect(() => {
    if (!store) return
    const onStoreChange = () => forceUpdate()
    store.subscribers.add(onStoreChange)
    return () => {
      store.subscribers.delete(onStoreChange)
    }
  }, [store])

  if (!store) return null

  return (
    <Div
      position="absolute"
      width="1px"
      height="1px"
      p="0"
      m="-1px"
      overflow="hidden"
      clip="rect(0, 0, 0, 0)"
      whiteSpace="nowrap"
      border="0"
    >
      <Div role="status" aria-live="polite" data-testid="polite-announcer">
        {store.politeAnnouncement}
      </Div>
      <Div role="alert" aria-live="assertive" data-testid="assertive-announcer">
        {store.assertiveAnnouncement}
      </Div>
    </Div>
  )
}
