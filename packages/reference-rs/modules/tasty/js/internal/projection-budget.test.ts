/**
 * Tests for the bounds every display call shares: the step budget, the depth guard, the hook path.
 * The budget fixture is an interface diamond whose inheritance paths outnumber the budget, scanned from a
 * temporary project, so the walk is real. A call that runs out returns its declared members and raises one notice naming
 * the symbol; each public call gets a budget of its own, and its getDisplayResult reports `truncated` and the notices its
 * own walk raised, so calls that overlap on one api report independently. The depth fixture is a non-cyclic alias chain
 * longer than the depth cap, a Pick whose key chain runs past it, a shorter chain, and a cycle that loses nothing: a depth
 * cut drops members, so it is flagged like a budget cut, while a repeat already on the path is not. The hook fixture is an
 * alias whose type parameter the hook answers with the same alias, the way reference-core answers `P` with
 * `SystemProperties`; the walk runs in a child process through runIsolated, so a cycle that never ends shows as a signal
 * rather than a crashed worker.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { expectBounded, runIsolated } from '../../../../testing/isolated.js'
import type { TastyApi } from '../api-types.js'
import { scanAndEmitModules } from '../runtime.js'
import { createTastyApi } from './api-runtime.js'
import { projectionBudgetWarning } from './object-projection-references.js'

const DIAMOND_DEPTH = 16
const CHAIN_LENGTH = 40
const HOOK_DRIVER = fileURLToPath(new URL('./projection-hook-driver.mjs', import.meta.url))

interface HookReport {
  members: string[]
  hookCalls: number
  notices: string[]
}

function diamondSource(depth: number): string {
  let source = 'export interface I0a { a0: 1 }\nexport interface I0b { b0: 1 }\n'
  for (let level = 1; level <= depth; level++) {
    source += `export interface I${level}a extends I${level - 1}a, I${level - 1}b { a${level}: 1 }\n`
    source += `export interface I${level}b extends I${level - 1}a, I${level - 1}b { b${level}: 1 }\n`
  }
  return source
}

/** Alias chain of `length` levels (each one intersects the next), a short chain, and a two-alias cycle. */
function chainSource(length: number): string {
  let source = ''
  for (let level = 0; level < length; level++) {
    source += `export type Chain${level} = Chain${level + 1} & { c${level}: 1 }\n`
  }
  source += `export type Chain${length} = { c${length}: 1 }\n`
  source += 'export type Short0 = Short1 & { s0: 1 }\nexport type Short1 = Short2 & { s1: 1 }\n'
  source += 'export type Short2 = { s2: 1 }\n'
  source += 'export type Loop0 = Loop1 & { l0: 1 }\nexport type Loop1 = Loop0 & { l1: 1 }\n'
  return source
}

/** A union chain of `length` key aliases, and a Pick whose key argument is that chain. */
function keyChainSource(length: number): string {
  let source = 'export interface KeyBase { k0: 1; k1: 1 }\n'
  for (let level = 0; level < length; level++) {
    source += `export type KeyChain${level} = KeyChain${level + 1} | 'k${level}'\n`
  }
  source += `export type KeyChain${length} = 'k${length}'\n`
  source += 'export type Picked = Pick<KeyBase, KeyChain0>\n'
  return source
}

function writeEmittedArtifacts(outputDir: string, files: Record<string, string>): void {
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(outputDir, relativePath.replace(/^\.\//, ''))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content.endsWith('\n') ? content : `${content}\n`, 'utf-8')
  }
}

describe('projection step budget', () => {
  let projectRoot = ''
  let api: TastyApi

  beforeAll(async () => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tasty-budget-'))
    fs.mkdirSync(path.join(projectRoot, 'src'))
    fs.writeFileSync(path.join(projectRoot, 'src', 'a.ts'), diamondSource(DIAMOND_DEPTH))

    const emitted = scanAndEmitModules(projectRoot, ['src/**/*.ts'])
    const outputDir = path.join(projectRoot, 'artifacts')
    writeEmittedArtifacts(outputDir, {
      ...(emitted.modules ?? {}),
      ...(emitted.type_declarations ?? {}),
    })
    api = createTastyApi({ manifestPath: path.join(outputDir, 'manifest.js') })
    await api.ready()
  })

  afterAll(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true })
  })

  it('ends a walk that runs out of steps with its declared members and one notice', async () => {
    const root = await api.loadSymbolByName(`I${DIAMOND_DEPTH}a`)
    const members = (await root.getDisplayMembers()).map(member => member.getName())

    expect(members).toContain(`a${DIAMOND_DEPTH}`)
    expect(api.getRuntimeNotices()).toHaveLength(1)
    expect(api.getRuntimeNotices()[0]).toContain(`"I${DIAMOND_DEPTH}a"`)
    expect(api.getRuntimeNotices()[0]).toContain('stopped after 10000 steps')
  })

  it('gives a later call its own budget, so a small symbol raises no new notice', async () => {
    const leaf = await api.loadSymbolByName('I1a')
    const members = (await leaf.getDisplayMembers()).map(member => member.getName())

    expect(members.sort()).toEqual(['a0', 'a1', 'b0'])
    expect(api.getRuntimeNotices()).toHaveLength(1)
  })

  it('reports truncated with its notice on the call that runs out, and false with none on a call that completes', async () => {
    const root = await api.loadSymbolByName(`I${DIAMOND_DEPTH}a`)
    const leaf = await api.loadSymbolByName('I1a')
    const cut = await api.graph.getDisplayResult(root)
    const whole = await api.graph.getDisplayResult(leaf)

    expect(cut.truncated).toBe(true)
    expect(cut.members.map(member => member.getName())).toContain(`a${DIAMOND_DEPTH}`)
    expect(cut.notices).toEqual([expect.stringContaining('stopped after 10000 steps')])
    expect(whole.truncated).toBe(false)
    expect(whole.notices).toEqual([])
    expect(whole.members.map(member => member.getName()).sort()).toEqual(['a0', 'a1', 'b0'])
  })

  it('reports each of two overlapping calls on the same api on its own budget', async () => {
    const root = await api.loadSymbolByName(`I${DIAMOND_DEPTH}a`)
    const leaf = await api.loadSymbolByName('I1a')
    const [cut, whole] = await Promise.all([
      api.graph.getDisplayResult(root),
      api.graph.getDisplayResult(leaf),
    ])

    expect([cut.truncated, whole.truncated]).toEqual([true, false])
  })

  it('builds the warning consumers attach from a notice, under the registered code, naming the subject', async () => {
    const root = await api.loadSymbolByName(`I${DIAMOND_DEPTH}a`)
    const [notice] = (await api.graph.getDisplayResult(root)).notices

    expect(projectionBudgetWarning(notice!, 'Button')).toEqual({
      severity: 'warning',
      code: 'TST-W-PROJECTION-BUDGET',
      message: `Button: Member projection of "I${DIAMOND_DEPTH}a" stopped after 10000 steps; inherited members past that point may be omitted.`,
    })
    expect(projectionBudgetWarning(notice!).message).toMatch(/^Member projection of/)
  })
})

describe('projection depth guard', () => {
  let chainRoot = ''
  let chainApi: TastyApi

  beforeAll(async () => {
    chainRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tasty-depth-'))
    fs.mkdirSync(path.join(chainRoot, 'src'))
    fs.writeFileSync(path.join(chainRoot, 'src', 'chain.ts'), chainSource(CHAIN_LENGTH))
    fs.writeFileSync(path.join(chainRoot, 'src', 'keys.ts'), keyChainSource(CHAIN_LENGTH))

    const emitted = scanAndEmitModules(chainRoot, ['src/**/*.ts'])
    const outputDir = path.join(chainRoot, 'artifacts')
    writeEmittedArtifacts(outputDir, {
      ...(emitted.modules ?? {}),
      ...(emitted.type_declarations ?? {}),
    })
    chainApi = createTastyApi({ manifestPath: path.join(outputDir, 'manifest.js') })
    await chainApi.ready()
  })

  afterAll(() => {
    fs.rmSync(chainRoot, { recursive: true, force: true })
  })

  it('drops the members past the depth cap, flags the call, and names the depth limit in its notice', async () => {
    const root = await chainApi.loadSymbolByName('Chain0')
    const result = await chainApi.graph.getDisplayResult(root)
    const names = result.members.map(member => member.getName())

    expect(names).toContain('c0')
    expect(names).not.toContain(`c${CHAIN_LENGTH}`)
    expect(result.truncated).toBe(true)
    expect(result.notices).toEqual([expect.stringContaining('"Chain0" stopped at nesting depth 32')])
    expect(chainApi.getRuntimeNotices()).toEqual(expect.arrayContaining(result.notices))
  })

  it('drops a Pick whose key chain runs past the depth cap, and flags that call too', async () => {
    const picked = await chainApi.loadSymbolByName('Picked')
    const result = await chainApi.graph.getDisplayResult(picked)

    expect(result.members).toEqual([])
    expect(result.truncated).toBe(true)
    expect(result.notices).toEqual([expect.stringContaining('"Picked" stopped at nesting depth 32')])
  })

  it('leaves a chain inside the depth cap whole, with no flag and no notice', async () => {
    const short = await chainApi.loadSymbolByName('Short0')
    const result = await chainApi.graph.getDisplayResult(short)

    expect(result.members.map(member => member.getName()).sort()).toEqual(['s0', 's1', 's2'])
    expect(result.truncated).toBe(false)
    expect(result.notices).toEqual([])
  })

  it('reports a cycle that loses nothing as complete, with no flag and no notice', async () => {
    const loop = await chainApi.loadSymbolByName('Loop0')
    const result = await chainApi.graph.getDisplayResult(loop)

    expect(result.members.map(member => member.getName()).sort()).toEqual(['l0', 'l1'])
    expect(result.truncated).toBe(false)
    expect(result.notices).toEqual([])
  })
})

describe('projection through the type-parameter hook', () => {
  let hookRoot = ''
  let hookManifest = ''

  beforeAll(() => {
    hookRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tasty-hook-'))
    fs.mkdirSync(path.join(hookRoot, 'src'))
    fs.writeFileSync(path.join(hookRoot, 'src', 'a.ts'), 'export type Sys<P> = P & { s: 1 }\n')

    const emitted = scanAndEmitModules(hookRoot, ['src/**/*.ts'])
    const outputDir = path.join(hookRoot, 'artifacts')
    writeEmittedArtifacts(outputDir, {
      ...(emitted.modules ?? {}),
      ...(emitted.type_declarations ?? {}),
    })
    hookManifest = path.join(outputDir, 'manifest.js')
  })

  afterAll(() => {
    fs.rmSync(hookRoot, { recursive: true, force: true })
  })

  it('ends a hook cycle at the symbol it revisits, inside the time bound', () => {
    const run = runIsolated<HookReport>({
      module: HOOK_DRIVER,
      fn: 'displayThroughHook',
      args: [hookManifest],
      timeoutMs: 20_000,
    })
    const report = expectBounded(run, { ms: 2000 })

    expect(report.members).toEqual(['s'])
    expect(report.hookCalls).toBe(1)
    expect(report.notices).toEqual([])
  })
})
