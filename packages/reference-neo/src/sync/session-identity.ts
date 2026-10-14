// Sync session identity: which process a lock owner really names. It takes a
// pid, and for a holder the identity and host its owner document recorded, and
// emits liveness verdicts and process facts. A pid alone is not an identity
// because the OS recycles pids, so an owner records its process start time where
// the platform can say it (/proc on Linux, `ps` on other POSIX hosts), and a
// reader calls the pid recycled only when that start time and the running
// process's own are both known and differ. Any weaker evidence keeps the plain
// signal-0 test, so Windows, a failed or timed-out `ps`, and an owner that
// recorded no identity all read a living pid as the holder: nothing here steals
// a lock or blocks a sync. An owner also records its hostname, because a pid
// names nothing on another machine that shares the folder.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { hostname } from 'node:os'

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

/** This machine's hostname, to record in an owner document; undefined when the OS cannot say. */
export function ownHostname(): string | undefined {
  try {
    const name = hostname()
    return name === '' ? undefined : name
  } catch {
    return undefined
  }
}

/**
 * The host a lock holder ran on when that is not this machine, else undefined.
 * A pid means nothing across machines, so a holder on another host is never
 * judged by its pid and never signalled; an owner that recorded no host is taken
 * to be here.
 */
export function foreignHostOf(holder: { host?: string }): string | undefined {
  return holder.host !== undefined && holder.host !== ownHostname() ? holder.host : undefined
}

/**
 * Judge a lock holder from its owner document. A pid nothing runs is dead, and
 * so is one the probe reports gone. A pid that exists is the holder unless two
 * identities that are both known disagree, the one the owner recorded and the
 * one the process has now: only that mismatch is a recycled pid. An owner that
 * recorded no identity, or a probe that could not answer (`ps` failed or timed
 * out), leaves the plain existence test standing, so a pid we may not signal
 * (EPERM) is still the holder and a lock is never stolen on a failed probe.
 * `probe` is the seam the verdict table is tested through.
 */
export function judgeHolder(
  holder: { pid: number; identity?: string },
  probe: (pid: number) => ProcessProbe = probeProcess,
): HolderVerdict {
  if (!pidAlive(holder.pid)) return 'dead'
  const seen = probe(holder.pid)
  if (seen.status === 'gone') return 'dead'
  if (seen.status === 'unknown' || holder.identity === undefined) return 'live'
  return seen.identity === holder.identity ? 'live' : 'recycled'
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
