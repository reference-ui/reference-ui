/**
 * Link clique and link lattice bound (ATM-BOUND-05). The station compiles `input/`, a plain styling tree, in process;
 * that stylesheet is the reference. This spec copies `input/` into two temp projects it owns. One adds a clique of
 * seven directories, each linked to the other six; the other adds a sixteen-level lattice, each level's two directories
 * linked to both directories of the level below. Each project compiles through driver.mjs in a child process under the
 * budget, and must produce the plain tree's stylesheet and class map. A walk that follows every link path again
 * multiplies its work, so an unbounded walk fails here by name. The parent removes both temp projects.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { expectBounded, runIsolated, withTempDir } from '../../../../../testing/isolated.js'
import type { AtomicCaseSpec, CompileResult } from '../../harness/helpers.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const INPUT_DIR = path.join(HERE, 'input')
const DRIVER = path.join(HERE, 'driver.mjs')
const BUDGET_MS = 2000
const KILL_MS = 15_000
const CLIQUE_SIZE = 7
const LATTICE_LEVELS = 16
const SIDES = ['a', 'b']

/** Seven directories under `src/clique`, each with a link to every other one. */
function linkClique(root: string): void {
  const names = Array.from({ length: CLIQUE_SIZE }, (_, index) => `k${index}`)
  for (const from of names) {
    fs.mkdirSync(path.join(root, 'src', 'clique', from), { recursive: true })
  }
  for (const from of names) {
    for (const to of names.filter(name => name !== from)) {
      fs.symlinkSync(path.join('..', to), path.join(root, 'src', 'clique', from, `to_${to}`))
    }
  }
}

/** Sixteen levels under `src/lattice`, each with two directories linked to both directories of the level below. */
function linkLattice(root: string): void {
  const level = (index: number) => path.join(root, 'src', 'lattice', `n${index}`)
  for (let index = 0; index < LATTICE_LEVELS; index++) {
    for (const side of SIDES) {
      fs.mkdirSync(path.join(level(index), side), { recursive: true })
    }
  }
  for (let index = 0; index < LATTICE_LEVELS - 1; index++) {
    for (const side of SIDES) {
      for (const target of SIDES) {
        fs.symlinkSync(
          path.join('..', '..', `n${index + 1}`, target),
          path.join(level(index), side, `to_${target}`)
        )
      }
    }
  }
}

/** Compiles the plain tree plus `link` in a child process, and returns it once it is inside the budget. */
function compileLinked(link: (root: string) => void): CompileResult {
  return withTempDir('atm-bound-05-', root => {
    fs.cpSync(INPUT_DIR, root, { recursive: true })
    link(root)
    const run = runIsolated<CompileResult>({
      module: DRIVER,
      fn: 'compileProject',
      args: [root],
      timeoutMs: KILL_MS,
    })
    return expectBounded(run, { ms: BUDGET_MS })
  })
}

const spec: AtomicCaseSpec = {
  id: 'ATM-BOUND-05',
  verify(result) {
    for (const link of [linkClique, linkLattice]) {
      const linked = compileLinked(link)
      expect(linked.stylesheet).toBe(result.stylesheet)
      expect(linked.css?.classes).toEqual(result.css?.classes)
    }
  },
}

export default spec
