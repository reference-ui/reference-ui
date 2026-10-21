/**
 * Child-process entry for ATM-BOUND-03. runIsolated imports this module in a fresh Node process and calls
 * compileWithConsumer, which copies the committed input clique into a temp project, adds the consumer
 * `src/app.ts` that imports `missing` from `./m0` (no module in the clique exports it), and compiles that
 * project through the built atomic dist. The temp project is removed before the call returns. A hang or a
 * slow walk ends this child, so the spec's budget names it instead of stalling the suite.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const INPUT_DIR = path.join(HERE, 'input')
const ATOMIC_DIST = path.resolve(HERE, '..', '..', '..', '..', '..', 'dist', 'atomic.mjs')
const LIB_FIXTURE = path.resolve(HERE, '..', '..', 'fixtures', 'lib-system-spec.json')

const CONSUMER = [
  "import { css } from '@reference-ui/react'",
  "import { missing } from './m0'",
  '',
  'export const a = css({ color: missing })',
  "export const b = css({ color: 'red' })",
  '',
].join('\n')

export async function compileWithConsumer() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'atm-bound-03-'))
  try {
    fs.cpSync(INPUT_DIR, root, { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'app.ts'), CONSUMER)
    const { compile } = await import(pathToFileURL(ATOMIC_DIST).href)
    const baseSystem = JSON.parse(fs.readFileSync(LIB_FIXTURE, 'utf8'))
    return await compile({ logs: ['proof'], rootDir: root, baseSystem })
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}
