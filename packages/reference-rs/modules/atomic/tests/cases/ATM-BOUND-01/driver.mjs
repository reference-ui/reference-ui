/**
 * Child-process entry for ATM-BOUND-01. runIsolated imports this module in a fresh Node process and calls
 * compileInput, so a native abort ends that child rather than the Vitest worker. It compiles the case input
 * through the built atomic JS wrapper with the same base system helpers.ts uses for a case without its own:
 * an explicit `baseSystem` in the extras wins, otherwise the committed lib fixture applies.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ATOMIC_DIST = path.resolve(HERE, '..', '..', '..', '..', '..', 'dist', 'atomic.mjs')
const LIB_FIXTURE = path.resolve(HERE, '..', '..', 'fixtures', 'lib-system-spec.json')

export async function compileInput(rootDir, extras = {}) {
  const { compile } = await import(pathToFileURL(ATOMIC_DIST).href)
  const baseSystem = extras.baseSystem ?? JSON.parse(fs.readFileSync(LIB_FIXTURE, 'utf8'))
  return compile({ logs: ['proof'], rootDir, ...extras, baseSystem })
}
