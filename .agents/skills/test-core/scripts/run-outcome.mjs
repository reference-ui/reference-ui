/**
 * Outcome rules shared by the agent runners, so every tool reads a finished run the same way. exitCodeOf
 * turns how a child process closed into an exit code: a child killed by a signal has no code and must never
 * read as success, so it becomes 128 plus the signal number (the shell convention) and the signal is named.
 * vitestTestsRan reads vitest's last summary line and counts the tests that actually ran, because a name
 * filter that matches nothing skips every test and still exits 0.
 */
import { constants as signalConstants } from 'node:os'

export function exitCodeOf(code, signal) {
  if (code !== null && code !== undefined) return code
  if (!signal) return 1
  const exitCode = 128 + (signalConstants.signals[signal] ?? 1)
  console.error(`child process was killed by ${signal} (exit ${exitCode}).`)
  return exitCode
}

// The last summary line, e.g. "Tests  1 passed | 328 skipped (329)". Skipped and todo tests did not run, so a
// run where every test was skipped reports ran 0. The summary is null when vitest printed no Tests line at all.
export function vitestTestsRan(text) {
  const plain = text.replace(/\x1b\[[0-9;]*m/g, '')
  const last = [...plain.matchAll(/^\s*Tests\s+(.*?)\s*$/gm)].at(-1)
  if (!last) return { ran: 0, summary: null }
  let ran = 0
  for (const m of last[1].matchAll(/(\d+) (?:passed|failed)\b/g)) ran += Number(m[1])
  return { ran, summary: last[1] }
}
