import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join, tmpdir } from 'node:path'
import {
  initSessionState,
  transitionSession,
  transitionBuild,
  cleanupSession,
  getSessionManifest,
  resetSessionState,
} from './state'
import { readManifest, readLock } from './files'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ref-state-test-'))
  resetSessionState()
})

afterEach(() => {
  resetSessionState()
  rmSync(dir, { recursive: true, force: true })
})

describe('session/state – init', () => {
  it('writes session.json and session.lock on init', () => {
    initSessionState(dir, 'watch')

    const manifest = readManifest(dir)
    const lock = readLock(dir)

    expect(manifest).not.toBeNull()
    expect(manifest?.pid).toBe(process.pid)
    expect(manifest?.mode).toBe('watch')
    expect(manifest?.state).toBe('starting')
    expect(manifest?.buildState).toBe('idle')
    expect(lock).not.toBeNull()
    expect(lock?.pid).toBe(process.pid)
  })

  it('sets startedAt and updatedAt to the same ISO string on init', () => {
    initSessionState(dir, 'one-shot')
    const manifest = readManifest(dir)
    expect(manifest?.startedAt).toBe(manifest?.updatedAt)
  })

  it('in-memory manifest matches disk after init', () => {
    initSessionState(dir, 'watch')
    expect(getSessionManifest()).toEqual(readManifest(dir))
  })
})

describe('session/state – transitions', () => {
  it('transitionSession updates state and updatedAt on disk', () => {
    initSessionState(dir, 'watch')
    const before = readManifest(dir)!.updatedAt

    transitionSession('watching')

    const manifest = readManifest(dir)
    expect(manifest?.state).toBe('watching')
    expect(manifest?.updatedAt >= before).toBe(true)
  })

  it('transitionBuild updates buildState on disk', () => {
    initSessionState(dir, 'watch')
    transitionBuild('running')
    expect(readManifest(dir)?.buildState).toBe('running')

    transitionBuild('ready')
    expect(readManifest(dir)?.buildState).toBe('ready')
  })

  it('transitionSession is a no-op before init', () => {
    expect(() => transitionSession('failed')).not.toThrow()
    expect(readManifest(dir)).toBeNull()
  })

  it('transitionBuild is a no-op before init', () => {
    expect(() => transitionBuild('failed')).not.toThrow()
    expect(readManifest(dir)).toBeNull()
  })

  it('in-memory manifest stays in sync with disk transitions', () => {
    initSessionState(dir, 'watch')
    transitionSession('watching')
    transitionBuild('ready')
    expect(getSessionManifest()).toEqual(readManifest(dir))
  })
})

describe('session/state – cleanup', () => {
  it('cleanupSession writes stopped state and removes lock', () => {
    initSessionState(dir, 'watch')
    cleanupSession()

    expect(readManifest(dir)?.state).toBe('stopped')
    expect(readLock(dir)).toBeNull()
  })

  it('cleanupSession is a no-op before init', () => {
    expect(() => cleanupSession()).not.toThrow()
  })
})
