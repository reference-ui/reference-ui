/**
 * Tests for the bounds every public display call shares: the step budget and the hook re-entry path. The budget
 * fixture is an interface diamond whose inheritance paths outnumber the budget, scanned from a temporary project, so
 * the walk is real. A call that runs out returns its declared members and raises one notice naming the symbol; each
 * public call gets a budget of its own. The hook fixture is an alias whose type parameter the hook answers with the
 * same alias, the way reference-core answers `P` with `SystemProperties`; the walk runs in a child process through
 * runIsolated, so a cycle that never ends shows as a signal rather than a crashed worker.
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

const DIAMOND_DEPTH = 16
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
