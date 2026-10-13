// Sync session covered handshake: what a one-shot does when a resident watch
// already owns the project. It takes the lock dir, the watch's owner document
// and a notice sink, pokes the watch (SIGUSR2), and waits on the watch-state
// file until the resync that covers the poke has finished, so exit 0 means the
// output is current. It emits an outcome: current or failed when the watch
// answered, retake when the watch is stopping or gone (the caller waits for the
// release and syncs itself), or unpublished when the watch keeps no state file
// and the poke is all there is. A watch that never answers is reported, never
// killed and never taken for covered.

import { existsSync } from 'node:fs'
import { errorCode, sleep } from './session-claim.ts'
import { pidAlive, processSuspended } from './session-identity.ts'
import { readOwnerFile, readWatchState, type SyncSessionOwner, type WatchState } from './session-owner.ts'

export type CoveredOutcome = 'current' | 'failed' | 'retake' | 'unpublished'

export interface CoveredOptions {
  /** Notice sink for the lines this wait prints (stdout, or stderr under --json). */
  say: (line: string) => void
  /** How long the watch gets to publish its state, and then to ack the poke, before the wait is announced. */
  answerMs?: number
  /** How long the covering resync (or the watch's release) may take before the wait gives up. */
  budgetMs?: number
}

const ANSWER_MS = 2000
const BUDGET_MS = 120000
const POLL_MS = 20

const stoppingLine = (pid: number): string => `[ref] sync: the resident watch (pid ${pid}) is stopping, waiting to sync`

function giveUpMessage(holder: SyncSessionOwner, what: string, budgetMs: number): string {
  return `[ref] sync: the resident watch (pid ${holder.pid}) did not ${what} within ${Math.round(budgetMs / 1000)} s; rerun with --break-lock to sync without it`
}

// The watch's state, only while it names this very holder: a file left by an
// earlier watch of the same folder never speaks for the live one.
async function readHolderState(lockDir: string, holder: SyncSessionOwner): Promise<WatchState | null> {
  const state = await readWatchState(lockDir)
  return state !== null && state.pid === holder.pid && state.nonce === holder.lockNonce ? state : null
}

// The lock changed hands when its owner document now names someone else.
async function lockMoved(lockDir: string, holder: SyncSessionOwner): Promise<boolean> {
  const seen = await readOwnerFile(lockDir)
  return seen.status === 'ok' && seen.owner.lockNonce !== holder.lockNonce
}

// SIGUSR2 is the poke. Windows has no such signal, so a watch there can only be
// covered, never asked; a holder that died under us reads as gone.
function pokeWatch(holder: SyncSessionOwner): 'sent' | 'gone' | 'unsupported' {
  if (process.platform === 'win32') return 'unsupported'
  try {
    process.kill(holder.pid, 'SIGUSR2')
  } catch (error) {
    const code = errorCode(error)
    if (code === 'ESRCH') return 'gone'
    // A plain Error, not the errno: the acquire loop retries errno-coded faults as lost races.
    throw new Error(`[ref] sync: cannot poke the resident watch pid ${holder.pid} (${code ?? 'signal failed'})`)
  }
  return 'sent'
}

// Wait for the watch to publish its first state: it writes the file right after
// it can take a poke, so no file within the window means a watch that keeps none.
async function awaitFirstState(lockDir: string, holder: SyncSessionOwner, answerMs: number): Promise<WatchState | 'gone' | null> {
  const deadline = Date.now() + answerMs
  for (;;) {
    const state = await readHolderState(lockDir, holder)
    if (state !== null) return state
    if (!pidAlive(holder.pid)) return 'gone'
    if (Date.now() >= deadline) return null
    await sleep(POLL_MS)
  }
}

// Two seconds without an ack: a stopped watch cannot answer at all (say so and
// stop waiting), a busy one will when its loop frees up (say so and keep waiting).
function announceSilence(holder: SyncSessionOwner, say: (line: string) => void): void {
  if (processSuspended(holder.pid)) {
    throw new Error(
      `[ref] sync: the resident watch (pid ${holder.pid}) is suspended and cannot sync; resume it (kill -CONT ${holder.pid}), or rerun with --break-lock`,
    )
  }
  say(`[ref] sync: waiting for the resident watch (pid ${holder.pid}) to answer`)
}

async function holderGone(lockDir: string, holder: SyncSessionOwner, state: WatchState | null): Promise<boolean> {
  if (!pidAlive(holder.pid)) return true
  return state === null && (await lockMoved(lockDir, holder))
}

interface Wait {
  holder: SyncSessionOwner
  /** The `done` count that proves a resync started after the poke: one past what `requested` was before it. */
  target: number
  answerMs: number
  budgetMs: number
  say: (line: string) => void
}

// One read of the state against the poke. A resync that already covers the
// poke wins over a stop that began after it; the ack (`requested` reaching the
// target) only decides whether silence is worth announcing.
async function pollOnce(lockDir: string, wait: Wait): Promise<{ outcome: CoveredOutcome | null; acked: boolean }> {
  const { holder, target } = wait
  const state = await readHolderState(lockDir, holder)
  if (state !== null && state.done >= target) return { outcome: state.failed ? 'failed' : 'current', acked: true }
  if (await holderGone(lockDir, holder, state)) return { outcome: 'retake', acked: false }
  if (state?.stopping === true) {
    wait.say(stoppingLine(holder.pid))
    return { outcome: 'retake', acked: false }
  }
  return { outcome: null, acked: state !== null && state.requested >= target }
}

async function awaitAnswer(lockDir: string, wait: Wait): Promise<CoveredOutcome> {
  const started = Date.now()
  let announced = false
  while (Date.now() < started + wait.budgetMs) {
    await sleep(POLL_MS)
    const poll = await pollOnce(lockDir, wait)
    if (poll.outcome !== null) return poll.outcome
    if (!poll.acked && !announced && Date.now() - started >= wait.answerMs) {
      announced = true
      announceSilence(wait.holder, wait.say)
    }
  }
  throw new Error(giveUpMessage(wait.holder, 'finish a resync', wait.budgetMs))
}

/**
 * Poke the resident watch holding `lockDir` and wait until the resync that
 * covers the poke has finished. Rejects when the watch is suspended, or when it
 * does not finish within the budget; it never signals the watch for any reason
 * but the poke.
 */
export async function awaitWatchCoverage(lockDir: string, holder: SyncSessionOwner, options: CoveredOptions): Promise<CoveredOutcome> {
  const answerMs = options.answerMs ?? ANSWER_MS
  const before = await awaitFirstState(lockDir, holder, answerMs)
  if (before === 'gone') return 'retake'
  if (before === null) {
    pokeWatch(holder)
    return 'unpublished'
  }
  if (before.stopping) {
    options.say(stoppingLine(holder.pid))
    return 'retake'
  }
  const poke = pokeWatch(holder)
  if (poke === 'gone') return 'retake'
  if (poke === 'unsupported') return 'unpublished'
  const budgetMs = options.budgetMs ?? BUDGET_MS
  return awaitAnswer(lockDir, { holder, target: before.requested + 1, answerMs, budgetMs, say: options.say })
}

/**
 * Wait for a stopping or vanished watch to let go of the lock: the holder is
 * dead, the lock dir is gone, or its owner document now names someone else.
 * Rejects when the watch is still there after the budget.
 */
export async function awaitWatchRelease(lockDir: string, holder: SyncSessionOwner, budgetMs = BUDGET_MS): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (Date.now() < deadline) {
    if (!pidAlive(holder.pid) || !existsSync(lockDir) || (await lockMoved(lockDir, holder))) return
    await sleep(POLL_MS)
  }
  throw new Error(giveUpMessage(holder, 'release the lock', budgetMs))
}
