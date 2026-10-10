/**
 * Toast announcements: fires the Announcer for toasts carrying an explicit
 * announce string, scoped to the toast's document. Opt-in per call so
 * screen readers speak only what the caller marks assertive — the API
 * layer invokes this on every show, update, and define path.
 */
import { announce } from '../../Announcer'
import type { ToastOptions } from '../types'

export function maybeAnnounce(options?: ToastOptions) {
  if (options?.announce == null) return
  announce(options.announce, { document: options.document })
}
