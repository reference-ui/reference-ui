import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import {
  ANNOUNCE_CLEAR_DELAY,
  announce,
  getAnnouncerSnapshot,
  type AnnounceOptions,
} from './Announcer'
import { ReferenceLibrary } from '../ReferenceLibrary'

function doc(): Document {
  return {} as Document
}

describe('announce', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ANN-API-01: Announcer should ignore blank messages when announce is called with empty or whitespace-only strings', async () => {
    const d = doc()
    announce('', { document: d })
    announce('   ', { document: d })
    announce('\n\t', { document: d })
    expect(getAnnouncerSnapshot(d).polite).toBe('')
    expect(getAnnouncerSnapshot(d).pending).toEqual([])

    announce('Complete', { document: d })
    await Promise.resolve()

    const snap = getAnnouncerSnapshot(d)
    expect(snap.polite).toBe('Complete')
    expect(snap.assertive).toBe('')
  })

  it('ANN-API-06: Announcer should no-op when announce runs without a DOM document', () => {
    const origWindow = (globalThis as unknown as { window?: unknown }).window
    const origDocument = (globalThis as unknown as { document?: unknown }).document

    try {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        get() {
          throw new Error('window is not defined in SSR')
        },
      })
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        get() {
          throw new Error('document is not defined in SSR')
        },
      })

      expect(() => {
        announce('Saved')
        announce('Saved', { politeness: 'assertive' })
      }).not.toThrow()
    } finally {
      if (origWindow === undefined) {
        delete (globalThis as unknown as { window?: unknown }).window
      } else {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          writable: true,
          value: origWindow,
        })
      }

      if (origDocument === undefined) {
        delete (globalThis as unknown as { document?: unknown }).document
      } else {
        Object.defineProperty(globalThis, 'document', {
          configurable: true,
          writable: true,
          value: origDocument,
        })
      }
    }
  })

  it('ANN-API-07: Announcer should not require a snapshot getter when application code announces', () => {
    expect(typeof announce).toBe('function')
    const opts: AnnounceOptions = {
      politeness: 'polite',
    }
    expect(opts.politeness).toBe('polite')
    const d = doc()
    expect(() => announce('Test message', { document: d })).not.toThrow()
  })

  it('ANN-LIVE-08: Announcer should drop in-flight inserts when a newer token lands on that channel', async () => {
    vi.useFakeTimers()
    const d = doc()

    announce('A', { document: d })
    announce('B', { document: d })

    await Promise.resolve()
    expect(getAnnouncerSnapshot(d).polite).toBe('B')

    await vi.advanceTimersByTimeAsync(2000)
    announce('C', { document: d })
    await Promise.resolve()

    expect(getAnnouncerSnapshot(d).polite).toBe('C')

    await vi.advanceTimersByTimeAsync(ANNOUNCE_CLEAR_DELAY + 100)
    expect(getAnnouncerSnapshot(d).polite).toBe('')
  })

  it('ANN-ENV-01: Announcer should emit no host markup when ReferenceLibrary server-renders', () => {
    const html = renderToString(
      React.createElement(
        ReferenceLibrary,
        null,
        React.createElement('main', null, 'Hello')
      )
    )

    expect(html).toContain('<main>Hello</main>')
    expect(html).not.toContain('data-reference-announcer-host')
    expect(html).not.toContain('aria-live')
  })

  it('ANN-ENV-02: Announcer should create one client host when server markup hydrates', () => {
    const html = renderToString(
      React.createElement(
        ReferenceLibrary,
        null,
        React.createElement('div', { 'data-testid': 'app' }, 'Client Content')
      )
    )
    expect(html).toContain('Client Content')
    expect(html).not.toContain('data-reference-announcer-host')
  })

  it('ANN-ENV-04: Announcer should not throw when flushSync has no React flush target', () => {
    const d = doc()
    expect(() => {
      announce('Sync test', { document: d })
    }).not.toThrow()
  })

  it('TO-ANN-01 / ANN-LIVE-01: polite announce stores the message without creating a toast', async () => {
    const d = doc()
    announce('Project saved', { document: d })
    await Promise.resolve()
    expect(getAnnouncerSnapshot(d).polite).toBe('Project saved')
    expect(getAnnouncerSnapshot(d).assertive).toBe('')
  })

  it('TO-ANN-02 / ANN-LIVE-02: polite and assertive messages coexist', async () => {
    const d = doc()
    announce('Background sync complete', { politeness: 'polite', document: d })
    announce('Session expired', { politeness: 'assertive', document: d })
    await Promise.resolve()
    expect(getAnnouncerSnapshot(d).polite).toBe('Background sync complete')
    expect(getAnnouncerSnapshot(d).assertive).toBe('Session expired')
  })

  it('TO-ANN-05 / ANN-LIVE-03: repeating the same message produces a clear then reinsert', async () => {
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

  it('TO-ANN-07 / ANN-LIVE-04: blank messages are ignored and the live text clears after the delay', async () => {
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

  it('TO-ANN-08 / ANN-LIFE-01: pre-activation announces keep a pending visual/AT replay queue', async () => {
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
