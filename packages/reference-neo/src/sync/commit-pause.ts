// Test-only pause point inside the staged commit. It reads REF_TEST_COMMIT_PAUSE at call time: unset, which is every real run, it returns at once
// and touches nothing. Set to a directory, it writes `paused-<pid>` there and blocks this process, synchronously because the commit is, until
// `resume-<pid>` appears, so a spec acts at an exact point of the commit instead of racing it with a signal. A pause nobody resumes throws after
// a hard cap, naming the variable, rather than hang a test run.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** The variable that arms the pause: a directory the paused process writes its marker into and watches for its resume file. */
export const COMMIT_PAUSE_ENV = 'REF_TEST_COMMIT_PAUSE'

// Each wait slice is short so a resume lands promptly; the cap bounds a pause no spec ever resumes.
const POLL_MS = 5
const MAX_PAUSE_MS = 120_000

export interface CommitPauseOptions {
  /** Where to read the variable from; the live process environment by default. */
  env?: NodeJS.ProcessEnv
  /** The longest the pause may last before it throws, in milliseconds. */
  capMs?: number
}

// A word nothing ever signals: waiting on it is an exact, CPU-free sleep that never yields to the event loop.
const parkedWord = new Int32Array(new SharedArrayBuffer(4))

/** The file a process writes once it stands at the pause point. */
export function pausedMarkerOf(pauseDir: string, pid: number): string {
  return join(pauseDir, `paused-${pid}`)
}

/** The file that releases the process with this pid from its pause. */
export function resumeMarkerOf(pauseDir: string, pid: number): string {
  return join(pauseDir, `resume-${pid}`)
}

/**
 * Stands the commit still when REF_TEST_COMMIT_PAUSE names a directory: writes the paused marker for this
 * pid, then blocks until the resume marker for this pid exists. Throws once `capMs` has passed without one.
 */
export function pauseInCommit(options: CommitPauseOptions = {}): void {
  const pauseDir = (options.env ?? process.env)[COMMIT_PAUSE_ENV]
  if (pauseDir === undefined || pauseDir === '') return
  const capMs = options.capMs ?? MAX_PAUSE_MS
  const resume = resumeMarkerOf(pauseDir, process.pid)
  mkdirSync(pauseDir, { recursive: true })
  writeFileSync(pausedMarkerOf(pauseDir, process.pid), `${process.pid}\n`)
  const deadline = Date.now() + capMs
  while (!existsSync(resume)) {
    if (Date.now() >= deadline) {
      throw new Error(`[ref] ${COMMIT_PAUSE_ENV}: no ${resume} within ${capMs} ms; the test-only commit pause gives up`)
    }
    Atomics.wait(parkedWord, 0, 0, POLL_MS)
  }
}
