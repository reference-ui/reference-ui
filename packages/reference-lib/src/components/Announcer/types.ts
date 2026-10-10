/**
 * Announcer's contract: the public AnnounceOptions a caller hands to
 * announce(), plus the internal PendingAnnouncement queue item and the
 * per-document AnnouncerStore shape. Kept free of JSX and logic so the
 * store, the host hook, and consumers can import the shape without
 * mounting anything or pulling in React.
 */

export interface AnnounceOptions {
  politeness?: 'polite' | 'assertive'
  document?: Document
}

export interface PendingAnnouncement {
  politeness: 'polite' | 'assertive'
  message: string
}

export interface AnnouncerStore {
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
