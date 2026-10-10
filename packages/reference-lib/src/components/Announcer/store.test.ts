import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ANNOUNCE_CLEAR_DELAY,
  MAX_PENDING_ANNOUNCEMENTS,
  announce,
  getAnnouncerSnapshot,
  getAnnouncerStore,
} from './store'

function doc(): Document {
  return {} as Document
}

describe('announcer store', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('caps the pre-activation pending queue at MAX_PENDING_ANNOUNCEMENTS', async () => {
    const d = doc()
    for (let i = 0; i < MAX_PENDING_ANNOUNCEMENTS + 5; i += 1) {
      announce(`message-${i}`, { document: d })
    }
    await Promise.resolve()
    const snap = getAnnouncerSnapshot(d)
    expect(snap.pending).toHaveLength(MAX_PENDING_ANNOUNCEMENTS)
    expect(snap.pending[0]).toEqual({ politeness: 'polite', message: 'message-5' })
    expect(snap.polite).toBe(`message-${MAX_PENDING_ANNOUNCEMENTS + 4}`)
  })

  it('supersedes an in-flight insert when a newer token lands on the channel', async () => {
    const d = doc()
    announce('stale', { document: d })
    announce('fresh', { document: d })
    await Promise.resolve()
    expect(getAnnouncerSnapshot(d).polite).toBe('fresh')
  })

  it('clears live text after ANNOUNCE_CLEAR_DELAY and restarts the delay on re-announce', async () => {
    vi.useFakeTimers()
    const d = doc()
    announce('ephemeral', { document: d })
    await Promise.resolve()
    expect(getAnnouncerSnapshot(d).polite).toBe('ephemeral')
    await vi.advanceTimersByTimeAsync(ANNOUNCE_CLEAR_DELAY - 1)
    expect(getAnnouncerSnapshot(d).polite).toBe('ephemeral')
    announce('ephemeral', { document: d })
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(ANNOUNCE_CLEAR_DELAY - 1)
    expect(getAnnouncerSnapshot(d).polite).toBe('ephemeral')
    await vi.advanceTimersByTimeAsync(1)
    expect(getAnnouncerSnapshot(d).polite).toBe('')
  })

  it('returns one store per document and a snapshot that copies pending', async () => {
    const d = doc()
    expect(getAnnouncerStore(d)).toBe(getAnnouncerStore(d))
    announce('queued', { document: d })
    await Promise.resolve()
    const snap = getAnnouncerSnapshot(d)
    snap.pending.push({ politeness: 'polite', message: 'mutated' })
    expect(getAnnouncerSnapshot(d).pending).toEqual([{ politeness: 'polite', message: 'queued' }])
  })

  it('ignores blank messages without recording pending entries', () => {
    const d = doc()
    announce('', { document: d })
    announce('   ', { document: d })
    expect(getAnnouncerSnapshot(d).polite).toBe('')
    expect(getAnnouncerSnapshot(d).pending).toEqual([])
  })
})
