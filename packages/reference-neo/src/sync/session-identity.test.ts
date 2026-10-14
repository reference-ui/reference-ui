// Unit tests for process identity over real processes, never the workspace.
// They take this test process, spawned sleepers and made-up pids and assert the
// identity read, the /proc line parser, the holder verdicts (live, dead, recycled)
// and the stopped-process probe. The verdict table runs through stand-in probes,
// so what a failed or missing identity may never do is pinned on every host; the
// cases that need a real identity source skip on a host that has none (no ps, no
// /proc), where the production code falls back to signal 0.

import { spawn, type ChildProcess } from 'node:child_process'
import { hostname } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import {
  foreignHostOf,
  judgeHolder,
  ownHostname,
  ownIdentity,
  parseProcStat,
  pidAlive,
  probeProcess,
  processSuspended,
  type ProcessProbe,
} from './session-identity.ts'

const POSIX = process.platform !== 'win32'
const HAS_IDENTITY = probeProcess(process.pid).status === 'live'
const sleepers: ChildProcess[] = []

afterEach(() => {
  for (const child of sleepers.splice(0)) child.kill('SIGKILL')
})

function spawnSleeper(): ChildProcess & { pid: number } {
  const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' })
  if (child.pid === undefined) throw new Error('the sleeper did not spawn')
  sleepers.push(child)
  return child as ChildProcess & { pid: number }
}

function exited(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) resolve()
    else child.once('exit', () => resolve())
  })
}

describe('parseProcStat', () => {
  it('reads the state and the start tick after the last paren of the command name', () => {
    const tail = 'S 1 1234 1234 0 -1 4194560 100 0 0 0 5 2 0 0 20 0 9 0 987654 1000000 500'
    expect(parseProcStat(`1234 (node) ${tail}`)).toEqual({ state: 'S', start: '987654' })
    expect(parseProcStat(`1234 (a (b) c) ${tail}`)).toEqual({ state: 'S', start: '987654' })
    expect(parseProcStat(`1234 (node) T${tail.slice(1)}`)).toEqual({ state: 'T', start: '987654' })
  })

  it('reads a line that is too short or has no command name as unreadable', () => {
    expect(parseProcStat('')).toBeNull()
    expect(parseProcStat('1234 node S 1')).toBeNull()
    expect(parseProcStat('1234 (node) S 1 2 3')).toBeNull()
  })
})

describe('process identity', () => {
  it.skipIf(!HAS_IDENTITY)('reads one stable identity for a running process', () => {
    const first = probeProcess(process.pid)
    expect(first.status).toBe('live')
    expect(probeProcess(process.pid)).toEqual(first)
    expect(ownIdentity()).toBe(first.status === 'live' ? first.identity : undefined)
  })

  // The identity is a start time at one-second resolution, so two processes tell
  // apart once they start a second apart; a recycled pid always does.
  it.skipIf(!HAS_IDENTITY)('tells processes started a second apart apart and reports a dead pid as gone', async () => {
    const first = spawnSleeper()
    await new Promise((resolve) => setTimeout(resolve, 1100))
    const second = spawnSleeper()
    const earlier = probeProcess(first.pid)
    const later = probeProcess(second.pid)
    expect(earlier.status).toBe('live')
    expect(later.status).toBe('live')
    expect(later).not.toEqual(earlier)
    second.kill('SIGKILL')
    await exited(second)
    expect(probeProcess(second.pid)).toEqual({ status: 'gone' })
  })

  it('reads an identity as unknown on Windows, where only signal 0 is trusted', () => {
    if (process.platform === 'win32') expect(probeProcess(process.pid)).toEqual({ status: 'unknown' })
    else expect(['live', 'unknown']).toContain(probeProcess(process.pid).status)
  })
})

describe('holder verdicts', () => {
  it('reads a pid nothing runs as dead', () => {
    expect(judgeHolder({ pid: 2 ** 30 })).toBe('dead')
    expect(pidAlive(2 ** 30)).toBe(false)
  })

  it.skipIf(!HAS_IDENTITY)('reads a running pid as the holder only while its identity matches', () => {
    expect(judgeHolder({ pid: process.pid, identity: ownIdentity() })).toBe('live')
    expect(judgeHolder({ pid: process.pid, identity: 'another start time' })).toBe('recycled')
  })

  it.skipIf(!HAS_IDENTITY)('reads an unrelated same-user process under a recorded pid as recycled, never live', () => {
    const sleeper = spawnSleeper()
    const stale = { pid: sleeper.pid, identity: 'Thu Jan  1 00:00:00 1970' }
    expect(pidAlive(sleeper.pid)).toBe(true)
    expect(judgeHolder(stale)).toBe('recycled')
    const probe = probeProcess(sleeper.pid)
    if (probe.status !== 'live') throw new Error('the sleeper should be readable')
    expect(judgeHolder({ pid: sleeper.pid, identity: probe.identity })).toBe('live')
  })

  it.skipIf(!HAS_IDENTITY)('reads a running pid as live when its owner recorded no identity, never recycled', () => {
    const sleeper = spawnSleeper()
    expect(judgeHolder({ pid: process.pid })).toBe('live')
    expect(judgeHolder({ pid: sleeper.pid })).toBe('live')
  })

  // pid 1 always exists on a POSIX host: signal 0 answers alive to root and EPERM to
  // everyone else, and both are a pid that exists.
  it.skipIf(!POSIX)('reads pid 1 as live when its owner recorded no identity, root-owned or not', () => {
    expect(judgeHolder({ pid: 1 })).toBe('live')
  })

  it.skipIf(!POSIX || probeProcess(1).status !== 'live')('reads pid 1 as recycled only when the identity its owner recorded is not its own', () => {
    expect(judgeHolder({ pid: 1, identity: 'Thu Jan  1 00:00:00 1970' })).toBe('recycled')
  })
})

// The probe seam stands in for `ps` and /proc, so the table holds on any host.
describe('holder verdicts: a probe that fails or has nothing to compare never steals a lock', () => {
  const probing = (probe: ProcessProbe) => (): ProcessProbe => probe
  const recorded = 'Thu Jan  1 00:00:00 1970'

  it('reads an unknown probe as live while the pid exists, whether or not we may signal it', () => {
    const unknown = probing({ status: 'unknown' })
    expect(judgeHolder({ pid: process.pid, identity: recorded }, unknown)).toBe('live')
    expect(judgeHolder({ pid: process.pid }, unknown)).toBe('live')
    expect(judgeHolder({ pid: 2 ** 30, identity: recorded }, unknown)).toBe('dead')
  })

  it.skipIf(!POSIX)('reads an unknown probe over a pid we may not signal as live too', () => {
    expect(judgeHolder({ pid: 1, identity: recorded }, probing({ status: 'unknown' }))).toBe('live')
  })

  it('reads an owner that recorded no identity as live while the pid exists, whatever the pid is now', () => {
    const someoneElse = probing({ status: 'live', identity: 'Fri Jan  2 00:00:00 1970' })
    expect(judgeHolder({ pid: process.pid }, someoneElse)).toBe('live')
    expect(judgeHolder({ pid: 2 ** 30 }, someoneElse)).toBe('dead')
  })

  it('reads a probe that finds the pid gone as dead, recorded identity or not', () => {
    expect(judgeHolder({ pid: process.pid, identity: recorded }, probing({ status: 'gone' }))).toBe('dead')
    expect(judgeHolder({ pid: process.pid }, probing({ status: 'gone' }))).toBe('dead')
  })

  it('reads only two known identities that differ as recycled', () => {
    expect(judgeHolder({ pid: process.pid, identity: recorded }, probing({ status: 'live', identity: recorded }))).toBe('live')
    const later = probing({ status: 'live', identity: 'Fri Jan  2 00:00:00 1970' })
    expect(judgeHolder({ pid: process.pid, identity: recorded }, later)).toBe('recycled')
  })
})

describe('hosts', () => {
  it('reads this machine\'s hostname and takes an owner that recorded it, or none, to be here', () => {
    expect(ownHostname()).toBe(hostname())
    expect(foreignHostOf({ pid: process.pid })).toBeUndefined()
    expect(foreignHostOf({ pid: process.pid, host: hostname() })).toBeUndefined()
  })

  it('names the host of an owner that recorded another machine', () => {
    expect(foreignHostOf({ pid: process.pid, host: 'another-machine.example' })).toBe('another-machine.example')
  })
})

describe('stopped processes', () => {
  it.skipIf(!POSIX)('reports a SIGSTOPped process as suspended until it continues', async () => {
    const sleeper = spawnSleeper()
    expect(processSuspended(sleeper.pid)).toBe(false)
    sleeper.kill('SIGSTOP')
    const deadline = Date.now() + 5000
    while (!processSuspended(sleeper.pid) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20))
    expect(processSuspended(sleeper.pid)).toBe(true)
    sleeper.kill('SIGCONT')
    const resumeBy = Date.now() + 5000
    while (processSuspended(sleeper.pid) && Date.now() < resumeBy) await new Promise((resolve) => setTimeout(resolve, 20))
    expect(processSuspended(sleeper.pid)).toBe(false)
  })

  it('reports a pid nothing runs as not suspended', () => {
    expect(processSuspended(2 ** 30)).toBe(false)
  })
})
