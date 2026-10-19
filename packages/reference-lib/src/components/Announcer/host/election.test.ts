/**
 * Host-election proof: first-claimant wins, idempotent re-claim,
 * failover on release, and per-document independence. Pure registry
 * decisions over stub documents; lifecycle wiring proves out in CT.
 */
import { describe, expect, it } from 'vitest'
import { claimPrimaryHost, getPrimaryHost, releasePrimaryHost } from './election'

function doc(): Document {
  return {} as Document
}

describe('announcer host election', () => {
  it('elects the first claimant and rejects later hosts on the same document', () => {
    const d = doc()
    expect(claimPrimaryHost(d, 'host-1')).toBe(true)
    expect(claimPrimaryHost(d, 'host-2')).toBe(false)
    expect(getPrimaryHost(d)).toBe('host-1')
  })

  it('lets the winner re-claim idempotently (StrictMode remount)', () => {
    const d = doc()
    expect(claimPrimaryHost(d, 'host-1')).toBe(true)
    expect(claimPrimaryHost(d, 'host-1')).toBe(true)
    expect(getPrimaryHost(d)).toBe('host-1')
  })

  it('fails over to the next claimant after the winner releases', () => {
    const d = doc()
    claimPrimaryHost(d, 'host-1')
    releasePrimaryHost(d, 'host-2')
    expect(getPrimaryHost(d)).toBe('host-1')
    releasePrimaryHost(d, 'host-1')
    expect(getPrimaryHost(d)).toBeUndefined()
    expect(claimPrimaryHost(d, 'host-2')).toBe(true)
  })

  it('elects independently per document', () => {
    const d1 = doc()
    const d2 = doc()
    expect(claimPrimaryHost(d1, 'host-1')).toBe(true)
    expect(claimPrimaryHost(d2, 'host-1')).toBe(true)
    expect(getPrimaryHost(d1)).toBe('host-1')
    expect(getPrimaryHost(d2)).toBe('host-1')
  })
})
