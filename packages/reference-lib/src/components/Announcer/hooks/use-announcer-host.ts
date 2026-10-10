/**
 * Announcer's host lifecycle: useAnnouncerHost claims the single-host
 * election for its document, registers the document for untargeted
 * announce() resolution, subscribes to the store, and replays pending
 * pre-mount speech. On unmount it releases the election, unsubscribes,
 * and resets an orphaned store so a remount starts silent. Returns the
 * host ref, the stable election id, and the resolved document; the root
 * renders the live regions from those three values.
 */
import * as React from 'react'
import { claimPrimaryHost, releasePrimaryHost } from '../host/election'
import {
  getAnnouncerStore,
  registerAnnouncerDocument,
  replayPendingAnnouncements,
  safeGetGlobalDocument,
  unregisterAnnouncerDocument,
} from '../store'

let announcerHostIdCounter = 0

export interface AnnouncerHostSession {
  hostRef: React.RefObject<HTMLDivElement | null>
  hostId: string
  targetDoc: Document | undefined
}

export function useAnnouncerHost(docProp?: Document): AnnouncerHostSession {
  const hostRef = React.useRef<HTMLDivElement>(null)
  // Render-stable election id without useId: the id never reaches the DOM,
  // and useId shims may mint per render (React 17 CT), which drops the host.
  const [hostId] = React.useState(() => `announcer-host-${(announcerHostIdCounter += 1)}`)
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const resolvedDoc = docProp ?? safeGetGlobalDocument()
  const docRef = React.useRef<Document | undefined>(resolvedDoc)
  const isPrimaryRef = React.useRef<boolean>(false)

  React.useLayoutEffect(() => {
    const doc = docProp ?? hostRef.current?.ownerDocument ?? safeGetGlobalDocument()
    if (!doc) return
    docRef.current = doc

    isPrimaryRef.current = claimPrimaryHost(doc, hostId)
    if (!isPrimaryRef.current) return

    registerAnnouncerDocument(doc)
    const store = getAnnouncerStore(doc)
    const onStoreChange = () => forceUpdate()
    store.subscribers.add(onStoreChange)

    void replayPendingAnnouncements(store)

    return () => {
      if (isPrimaryRef.current) {
        releasePrimaryHost(doc, hostId)
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

  return { hostRef, hostId, targetDoc: docRef.current }
}
