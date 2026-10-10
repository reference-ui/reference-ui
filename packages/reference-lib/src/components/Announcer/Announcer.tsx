/**
 * Announcer's root: the AnnouncerHost live-region pair plus the module's
 * historical export surface. The host renders two hidden AT regions
 * (polite status, assertive alert) from the elected document's store and
 * stays null when unelected or document-less. All behavior lives in the
 * store, the host election, and the session hook; the re-exports below
 * keep the deep `./Announcer` import path stable for tests.
 */
import * as React from 'react'
import { getPrimaryHost } from './host/election'
import { useAnnouncerHost } from './hooks/use-announcer-host'
import { getAnnouncerStore } from './store'

export {
  ANNOUNCE_CLEAR_DELAY,
  MAX_PENDING_ANNOUNCEMENTS,
  announce,
  getAnnouncerSnapshot,
  getAnnouncerStore,
  registerAnnouncerDocument,
  resolveAnnouncerDocument,
  unregisterAnnouncerDocument,
} from './store'
export { announcerDiagnostic } from './shared/warn'
export type { AnnounceOptions } from './types'

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
  const { hostRef, hostId, targetDoc } = useAnnouncerHost(docProp)

  if (!targetDoc) return null

  const currentPrimary = getPrimaryHost(targetDoc)
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
      >
        {store.politeAnnouncement}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-reference-announcer="assertive"
      >
        {store.assertiveAnnouncement}
      </div>
    </div>
  )
}
