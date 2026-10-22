/**
 * Case specification for TST-BOUND-03.
 * `input/` is a plain tree of two files with no links. The spec copies it into two temp projects it owns: one adds a
 * clique of seven directories, each linked to the other six; the other adds a sixteen-level lattice, each level's two
 * directories linked to both directories of the level below. Every linked directory holds one interface file. Each
 * project builds through build-linked.mjs in a child process under the kill budget, inside 2 s, with no diagnostics,
 * and lists every real file once: the plain tree's symbols plus one per linked file, with no duplicates. A walk that
 * follows every link path again multiplies its work, so an unbounded walk fails here by name.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import {
  expectBounded,
  runIsolated,
  withTempDir,
  type StationSpec,
} from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

const CASE_DIR = path.dirname(fileURLToPath(import.meta.url))
const INPUT_DIR = path.join(CASE_DIR, 'input')
const DRIVER = path.join(CASE_DIR, 'build-linked.mjs')
const CLIQUE_SIZE = 7
const LATTICE_LEVELS = 16
const SIDES = ['a', 'b']
const KILL_BUDGET_MS = 15_000
const TIME_BUDGET_MS = 2000

/** The symbols `input/` declares: `App` in `src/app.ts` and `Card` in `src/card/card.ts`. */
const PLAIN_SYMBOLS = ['App', 'Card']

interface BuildReport {
  diagnostics: { code: string; file: string | null; message: string }[]
  symbols: string[]
}

/** Writes one file that declares a single interface, and returns nothing: the caller keeps the name it chose. */
function writeInterface(dir: string, file: string, name: string): void {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, file), `export interface ${name} { v: number }\n`)
}

/** Seven directories under `src/clique`, each holding one interface file and linked to every other directory. */
function linkClique(project: string): string[] {
  const names = Array.from({ length: CLIQUE_SIZE }, (_, index) => `k${index}`)
  for (const from of names) {
    writeInterface(path.join(project, 'src', 'clique', from), `${from}.ts`, from.toUpperCase())
  }
  for (const from of names) {
    for (const to of names.filter(name => name !== from)) {
      fs.symlinkSync(path.join('..', to), path.join(project, 'src', 'clique', from, `to_${to}`))
    }
  }
  return names.map(name => name.toUpperCase())
}

/** Sixteen levels under `src/lattice`, each with two directories holding one interface file apiece and linked to both directories of the level below. */
function linkLattice(project: string): string[] {
  const dirOf = (level: number, side: string) => path.join(project, 'src', 'lattice', `n${level}`, side)
  const symbols: string[] = []
  for (let level = 0; level < LATTICE_LEVELS; level++) {
    for (const side of SIDES) {
      const name = `N${level}${side.toUpperCase()}`
      writeInterface(dirOf(level, side), `n${level}${side}.ts`, name)
      symbols.push(name)
    }
  }
  for (let level = 0; level < LATTICE_LEVELS - 1; level++) {
    for (const side of SIDES) {
      for (const target of SIDES) {
        fs.symlinkSync(
          path.join('..', '..', `n${level + 1}`, target),
          path.join(dirOf(level, side), `to_${target}`),
        )
      }
    }
  }
  return symbols
}

/** Builds the plain tree plus one linked shape in a child process, and returns the report with the linked symbols. */
function buildLinked(link: (project: string) => string[]): { report: BuildReport; linked: string[] } {
  return withTempDir('tst-bound-03-', root => {
    const project = path.join(root, 'project')
    const out = path.join(root, 'out')
    fs.cpSync(INPUT_DIR, project, { recursive: true })
    const linked = link(project)
    const run = runIsolated<BuildReport>({
      module: DRIVER,
      fn: 'buildProject',
      args: [project, out],
      timeoutMs: KILL_BUDGET_MS,
    })
    return { report: expectBounded(run, { ms: TIME_BUDGET_MS }), linked }
  })
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-BOUND-03',
  verify() {
    for (const link of [linkClique, linkLattice]) {
      const { report, linked } = buildLinked(link)
      expect(report.diagnostics, 'the linked tree builds without diagnostics').toEqual([])
      expect(report.symbols, 'every real file lists its symbol exactly once').toEqual(
        [...PLAIN_SYMBOLS, ...linked].sort(),
      )
    }
  },
}

export default spec
