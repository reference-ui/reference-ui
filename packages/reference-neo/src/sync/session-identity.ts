// Sync session identity: which process a lock owner really names. It takes a
// pid, and for a holder the identity its owner document recorded, and emits
// liveness verdicts and process facts. A pid alone is not an identity because
// the OS recycles pids, so an owner records its process start time where the
// platform can say it (/proc on Linux, `ps` on other POSIX hosts) and a reader
// trusts the pid only while that start time still matches. Windows, and hosts
// with neither source, report an unknown identity and keep the plain signal-0
// test, so nothing here ever blocks a sync.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

export type ProcessProbe =
  | { status: 'live'; identity: string }
  | { status: 'gone' }
  | { status: 'unknown' }

/** What a reader makes of a lock holder: running, dead, or a pid now owned by another process. */
export type HolderVerdict = 'live' | 'dead' | 'recycled'

const PS_TIMEOUT_MS = 3000
// `ps` prints times in the caller's zone and locale: pin both so two syncs in
// different environments read one process as one identity.
const PS_ENV: NodeJS.ProcessEnv = { ...process.env, TZ: 'UTC', LC_ALL: 'C' }
const UNKNOWN: ProcessProbe = { status: 'unknown' }
const GONE: ProcessProbe = { status: 'gone' }

function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException)?.code
}

// Liveness without /proc: signal 0 probes existence, and EPERM (a process
// we cannot signal) still counts as alive for this plain test.
export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return errorCode(error) === 'EPERM'
  }
}

// The fields after the command name in /proc/<pid>/stat: the name is
// parenthesised and may hold spaces and parens, so split after the LAST ')'.
// Field 3 (state) opens the rest and field 22 (start time, in clock ticks
// since boot) is the 20th entry of it.
export function parseProcStat(stat: string): { state: string; start: string } | null {
  const close = stat.lastIndexOf(')')
  if (close < 0) return null
  const rest = stat.slice(close + 1).trim().split(' ')
  const state = rest[0]
  const start = rest[19]
  if (state === undefined || start === undefined || state === '' || start === '') return null
  return { state, start }
}

let procReadable: boolean | undefined
let bootId: string | undefined

function hasProc(): boolean {
  procReadable ??= existsSync('/proc/self/stat')
  return procReadable
}

// The boot id keeps a start tick from matching across a reboot.
function readBootId(): string {
  bootId ??= (() => {
    try {
      return readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim()
    } catch {
      return ''
    }
  })()
  return bootId
}

function readProcStat(pid: number): { state: string; start: string } | 'gone' | 'unknown' {
  let raw: string
  try {
    raw = readFileSync(`/proc/${pid}/stat`, 'utf8')
  } catch (error) {
    return errorCode(error) === 'ENOENT' || errorCode(error) === 'ESRCH' ? 'gone' : 'unknown'
  }
  return parseProcStat(raw) ?? 'unknown'
}

function probeProc(pid: number): ProcessProbe {
  const stat = readProcStat(pid)
  if (stat === 'gone') return GONE
  if (stat === 'unknown') return UNKNOWN
  return { status: 'live', identity: `${readBootId()}:${stat.start}` }
}

type PsRead = { ok: true; text: string } | { ok: false; why: 'gone' | 'unknown' }

// One `ps` read: the output with whitespace folded, or why there is none.
// A missing pid is exit 1 with nothing on either stream; anything else odd
// (no ps, a ps that rejects the options, a timeout) is unknown.
function runPs(pid: number, field: 'lstart' | 'state'): PsRead {
  const run = spawnSync('ps', ['-o', `${field}=`, '-p', String(pid)], {
    encoding: 'utf8',
    env: PS_ENV,
    timeout: PS_TIMEOUT_MS,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  if (run.error !== undefined || run.signal !== null) return { ok: false, why: 'unknown' }
  const text = run.stdout.trim().replace(/\s+/g, ' ')
  if (run.status === 0 && text !== '') return { ok: true, text }
  const missing = run.status === 1 && text === '' && run.stderr.trim() === ''
  return { ok: false, why: missing ? 'gone' : 'unknown' }
}

function probePs(pid: number): ProcessProbe {
  const read = runPs(pid, 'lstart')
  if (read.ok) return { status: 'live', identity: read.text }
  return read.why === 'gone' ? GONE : UNKNOWN
}

/**
 * Read a process's identity (its start time) from the best source this host
 * has. 'gone' means the source answered and the pid is not there; 'unknown'
 * means no source could answer, which callers treat as "trust the pid".
 */
export function probeProcess(pid: number): ProcessProbe {
  if (process.platform === 'win32') return UNKNOWN
  if (process.platform === 'linux' && hasProc()) return probeProc(pid)
  return probePs(pid)
}

let ownRead = false
let own: string | undefined

/**
 * This process's identity, to record in its owner document; undefined when the
 * host cannot say. Read twice before giving up (a fork can fail under load) and
 * cached, since a start time never changes.
 */
export function ownIdentity(): string | undefined {
  if (ownRead) return own
  for (let attempt = 0; attempt < 2 && own === undefined; attempt += 1) {
    const probe = probeProcess(process.pid)
    if (probe.status === 'live') own = probe.identity
  }
  ownRead = true
  return own
}

// Signal 0 distinguishes three answers: running, gone, or running under an
// owner we may not signal (a root process, another user's).
function signalState(pid: number): 'alive' | 'denied' | 'dead' {
  try {
    process.kill(pid, 0)
    return 'alive'
  } catch (error) {
    return errorCode(error) === 'EPERM' ? 'denied' : 'dead'
  }
}

/**
 * Judge a lock holder from its owner document. Dead pids are dead. A running
 * pid is the holder only while its identity matches the one the owner recorded;
 * a mismatch, or an owner that recorded none while this host can read one, is a
 * recycled pid. When the host cannot read identities, a pid we may not signal
 * can never have been our holder, so it reads as recycled too.
 */
export function judgeHolder(holder: { pid: number; identity?: string }): HolderVerdict {
  const signal = signalState(holder.pid)
  if (signal === 'dead') return 'dead'
  const probe = probeProcess(holder.pid)
  if (probe.status === 'gone') return 'dead'
  if (probe.status === 'live') return probe.identity === holder.identity ? 'live' : 'recycled'
  return signal === 'denied' ? 'recycled' : 'live'
}

/** True when the process is stopped (SIGSTOP, Ctrl-Z, a debugger); false when it is not or the host cannot say. */
export function processSuspended(pid: number): boolean {
  if (process.platform === 'win32') return false
  if (process.platform === 'linux' && hasProc()) {
    const stat = readProcStat(pid)
    return typeof stat === 'object' && stat.state.startsWith('T')
  }
  const read = runPs(pid, 'state')
  return read.ok && read.text.startsWith('T')
}
