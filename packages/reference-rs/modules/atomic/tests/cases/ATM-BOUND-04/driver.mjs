/**
 * Child-process entry for ATM-BOUND-04. runIsolated imports this module in a fresh Node process and calls
 * compileProject on a project the parent has already written: spec.ts copies the committed plain tree into a
 * temp project it owns, adds the self-links, and removes that project itself, so a child killed by its budget
 * leaves nothing behind. compileProject compiles the directory it is given through the built atomic dist with the
 * committed lib fixture as the base system; a walk that never finishes ends this child.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ATOMIC_DIST = path.resolve(HERE, '..', '..', '..', '..', '..', 'dist', 'atomic.mjs')
const LIB_FIXTURE = path.resolve(HERE, '..', '..', 'fixtures', 'lib-system-spec.json')

export async function compileProject(rootDir) {
  const { compile } = await import(pathToFileURL(ATOMIC_DIST).href)
  const baseSystem = JSON.parse(fs.readFileSync(LIB_FIXTURE, 'utf8'))
  return await compile({ logs: ['proof'], rootDir, baseSystem })
}
