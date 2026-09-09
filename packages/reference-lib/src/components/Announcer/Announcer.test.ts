import { afterEach, describe, expect, it, vi } from 'vitest'
import { ANNOUNCE_CLEAR_DELAY, announce, getAnnouncerSnapshot } from './Announcer'

function doc(): Document {
  return {} as Document
}

describe('announce', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('TO-ANN-01: polite announce stores the message without creating a toast', async () => {
    const d = doc()
    announce('Project saved', { document: d })
    await Promise.resolve()
    expect(getAnnouncerSnapshot(d).polite).toBe('Project saved')
    expect(getAnnouncerSnapshot(d).assertive).toBe('')
  })

  it('TO-ANN-02: polite and assertive messages coexist', async () => {
    const d = doc()
    announce('Background sync complete', { politeness: 'polite', document: d })
    announce('Session expired', { politeness: 'assertive', document: d })
    await Promise.resolve()
    expect(getAnnouncerSnapshot(d).polite).toBe('Background sync complete')
    expect(getAnnouncerSnapshot(d).assertive).toBe('Session expired')
  })

  it('TO-ANN-05: repeating the same message produces a clear then reinsert', async () => {
    const d = doc()
    const seen: string[] = []
    announce('Saved', { document: d })
    await Promise.resolve()
    seen.push(getAnnouncerSnapshot(d).polite)
    announce('Saved', { document: d })
    expect(getAnnouncerSnapshot(d).polite).toBe('')
    await Promise.resolve()
    seen.push(getAnnouncerSnapshot(d).polite)
    expect(seen).toEqual(['Saved', 'Saved'])
  })

  it('TO-ANN-07: blank messages are ignored and the live text clears after the delay', async () => {
    vi.useFakeTimers()
    const d = doc()
    announce('', { document: d })
    announce('   ', { document: d })
    announce('\n\t', { document: d })
    announce('Complete', { document: d })
    await Promise.resolve()
    expect(getAnnouncerSnapshot(d).polite).toBe('Complete')
    await vi.advanceTimersByTimeAsync(ANNOUNCE_CLEAR_DELAY - 1)
    expect(getAnnouncerSnapshot(d).polite).toBe('Complete')
    await vi.advanceTimersByTimeAsync(1)
    expect(getAnnouncerSnapshot(d).polite).toBe('')
  })

  it('TO-ANN-08: pre-activation announces keep a pending visual/AT replay queue', async () => {
    const d = doc()
    announce('Saved', { document: d })
    announce('Ready', { document: d })
    await Promise.resolve()
    const snap = getAnnouncerSnapshot(d)
    expect(snap.polite).toBe('Ready')
    expect(snap.pending).toEqual([
      { politeness: 'polite', message: 'Saved' },
      { politeness: 'polite', message: 'Ready' },
    ])
  })
})
