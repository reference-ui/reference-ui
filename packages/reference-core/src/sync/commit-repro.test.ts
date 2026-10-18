// Steady-publish repro legs: a live reader polls the generated folder while a
// real `ref sync` resync runs, the way a bundler dev server reads it. They
// take temp worlds plus a spawned resync and assert the reader never samples
// a missing or empty runtime file, an identical resync leaves mtimes alone
// (bundlers see zero events), and no staging dir survives. No signals, so
// these legs run wherever the `ref` child does.

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanDir } from './clean.ts'
import { sync } from './index.ts'

const BIN_PATH = fileURLToPath(new URL('../../bin/ref.ts', import.meta.url))
// The sync staging dir name sync wipes at start and removes at commit: the
// hygiene leg pins it so a stranded stage can never linger in the folder.
const STAGE_DIR_NAME = 'sync.stage'
const EXPECTED_FILES = [
  'system/baseSystem.mjs',
  'system/system.mjs',
  'styled/styles.css',
  'styled/runtime-data.mjs',
  'react/react.mjs',
  'types/types.mjs',
]
const POLL_MS = 2
const MIN_SAMPLES = 10
const MAX_VIOLATIONS = 10

const tempDirs: string[] = []
const liveChildren: ChildProcess[] = []

afterEach(async () => {
  await Promise.all(liveChildren.splice(0).map((child) => reap(child)))
  await Promise.all(tempDirs.splice(0).map((dir) => cleanDir(dir)))
})

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function configFile(): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    '',
    'export default defineConfig({',
    "  name: 'steady-test',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    '})',
    '',
  ].join('\n')
}

function tokensFile(): string {
  return [
    "import { tokens } from '@reference-ui/neo'",
    '',
    'tokens({',
    '  colors: {',
    "    brand: { value: '#7c3aed' },",
    "    ink: { value: '#1a1a2e' },",
    '  },',
    '})',
    '',
  ].join('\n')
}

// Filler stretches the resync window so the poll loop provably overlaps the
// run; the old wipe-first code strands a hole from millisecond zero, so any
// overlap at all pins the regression.
function fillerFile(i: number): string {
  return [
    "import { css } from '@reference-ui/react'",
    '',
    `export const a${i} = css({ color: 'brand', backgroundColor: 'ink' })`,
    `export const b${i} = css({ color: 'ink', borderColor: 'brand' })`,
    '',
  ].join('\n')
}

async function writeWorld(fillers: number): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-steady-'))
  tempDirs.push(dir)
  writeFileSync(join(dir, 'ui.config.ts'), configFile())
  mkdirSync(join(dir, 'theme'), { recursive: true })
  writeFileSync(join(dir, 'theme', 'tokens.ts'), tokensFile())
  for (let i = 0; i < fillers; i += 1) writeFileSync(join(dir, 'theme', `fill-${i}.ts`), fillerFile(i))
  return dir
}

function spawnBin(args: string[], cwd: string): ChildProcess {
  const child = spawn(process.execPath, [BIN_PATH, ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  liveChildren.push(child)
  child.stdout?.resume()
  child.stderr?.resume()
  return child
}

function childDone(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null
}

async function waitForExit(child: ChildProcess, budgetMs = 120000): Promise<void> {
  const deadline = Date.now() + budgetMs
  while (!childDone(child)) {
    if (Date.now() >= deadline) throw new Error('timed out waiting for child exit')
    await sleep(25)
  }
}

async function reap(child: ChildProcess): Promise<void> {
  try {
    if (childDone(child)) return
    child.kill('SIGTERM')
    const deadline = Date.now() + 10000
    while (!childDone(child) && Date.now() < deadline) await sleep(50)
    if (!childDone(child)) child.kill('SIGKILL')
  } catch {
    // Reap runs in teardown; it must never mask the failing assertion.
  }
}

async function runBinToExit(args: string[], cwd: string): Promise<number | null> {
  const child = spawnBin(args, cwd)
  await waitForExit(child)
  return child.exitCode
}

function sampleOnce(outDir: string, violations: string[]): void {
  for (const rel of EXPECTED_FILES) {
    const full = join(outDir, rel)
    try {
      const size = statSync(full).size
      if (size === 0 && violations.length < MAX_VIOLATIONS) violations.push(`empty: ${rel}`)
    } catch (error) {
      if (violations.length < MAX_VIOLATIONS) {
        const code = (error as NodeJS.ErrnoException)?.code ?? 'unknown'
        violations.push(`${code}: ${rel}`)
      }
    }
  }
}

describe('steady publish: live-reader legs', () => {
  it('a resync never strands a reader: every sample sees every runtime file', async () => {
    const dir = await writeWorld(40)
    const outDir = join(dir, '.reference-ui')
    const baseline = await runBinToExit(['sync', dir], dir)
    expect(baseline).toBe(0)
    for (const rel of EXPECTED_FILES) expect(existsSync(join(outDir, rel))).toBe(true)

    // A stranded stage from a killed run must not survive the next sync.
    const stageDir = join(outDir, STAGE_DIR_NAME)
    mkdirSync(stageDir, { recursive: true })
    writeFileSync(join(stageDir, 'junk.txt'), 'stale stage marker')

    const violations: string[] = []
    let samples = 0
    const resync = spawnBin(['sync', dir], dir)
    while (!childDone(resync)) {
      sampleOnce(outDir, violations)
      samples += 1
      await sleep(POLL_MS)
    }
    await waitForExit(resync)
    expect(resync.exitCode).toBe(0)
    expect(samples).toBeGreaterThanOrEqual(MIN_SAMPLES)
    expect(violations).toEqual([])
    expect(existsSync(stageDir)).toBe(false)
  }, 180000)

  it('an identical resync leaves mtimes alone: bundlers see zero events', async () => {
    const dir = await writeWorld(0)
    const outDir = join(dir, '.reference-ui')
    await sync(dir)
    const before = new Map(EXPECTED_FILES.map((rel) => [rel, statSync(join(outDir, rel)).mtimeMs]))
    await sync(dir)
    for (const rel of EXPECTED_FILES) {
      expect(statSync(join(outDir, rel)).mtimeMs).toBe(before.get(rel))
    }
  }, 180000)
})
