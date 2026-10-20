/**
 * Announcer internals — NOT application API.
 *
 * Test-only and ReferenceLibrary-only entry. Applications announce via the
 * public barrel (`./index`: `announce` + `AnnounceOptions`); `ReferenceLibrary`
 * is the only supported host. Direct `AnnouncerHost` mounts outside tests
 * double-speak. See README (export freeze, multi-document topology).
 */
export { AnnouncerHost } from './Announcer'
export {
  ANNOUNCE_CLEAR_DELAY,
  MAX_PENDING_ANNOUNCEMENTS,
  getAnnouncerSnapshot,
  getAnnouncerStore,
  registerAnnouncerDocument,
  resolveAnnouncerDocument,
  unregisterAnnouncerDocument,
} from './store'
export { announcerDiagnostic } from './shared/warn'
