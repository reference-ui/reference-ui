// Preserve legs for the staged commit: a live writer's temp beside a preserved
// root survives a commit, a dead writer's temp and an old pid-less temp sweep
// away, and a fresh pid-less temp survives. Each leg runs over a temp outDir,
// with a dead pid from a child that has already exited, so no writer process or
// signal is needed. Fresh evaluator scratch survives a commit the same way, by age.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { commitStagedDir } from './commit.ts'
import { pidAlive } from './session.ts'

const HOUR_MS = 60 * 60_000
const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'core-commit-preserve-'))
  tempDirs.push(dir)
  return dir
}

function putFile(path: string, body = 'export {}\n'): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
}

// A pid-less temp is judged by its mtime, so backdate the dir after it is filled.
function backdate(dir: string, ms: number): void {
  const past = new Date(Date.now() - ms)
  utimesSync(dir, past, past)
}

// The pid of a child that has exited and been reaped: no process owns it now.
function exitedChildPid(): number {
  const child = spawnSync(process.execPath, ['-e', ''])
  if (typeof child.pid !== 'number') throw new Error('node -e did not spawn')
  return child.pid
}

describe('commit keeps writer temps beside a preserved root', () => {
  it('keeps the live and fresh temps, sweeps the dead and old legacy temps, and drops stale files', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const typesDir = join(outDir, 'types')
    const tasty = join(typesDir, 'tasty')
    const deadPid = exitedChildPid()
    expect(pidAlive(deadPid)).toBe(false)

    putFile(join(tasty, 'manifest.js'), 'manifest v1\n')
    const liveTemp = join(typesDir, `tasty.tmp-${process.pid}-live01`)
    putFile(join(liveTemp, 'manifest.js'), 'live writer\n')
    const deadTemp = join(typesDir, `tasty.tmp-${deadPid}-dead01`)
    putFile(join(deadTemp, 'x.js'))
    const legacyOld = join(typesDir, 'tasty.tmp-abc123')
    putFile(join(legacyOld, 'y.js'))
    backdate(legacyOld, HOUR_MS)
    const legacyFresh = join(typesDir, 'tasty.tmp-fresh1')
    putFile(join(legacyFresh, 'z.js'))
    putFile(join(typesDir, 'tasty-old', 'k.js'))
    putFile(join(outDir, 'stale.js'))
    const stage = join(root, 'stage')
    putFile(join(stage, 'index.js'), 'index v1\n')

    const stats = commitStagedDir(stage, outDir, { preserve: [tasty] })

    expect(readFileSync(join(tasty, 'manifest.js'), 'utf8')).toBe('manifest v1\n')
    expect(existsSync(join(liveTemp, 'manifest.js'))).toBe(true)
    expect(existsSync(join(legacyFresh, 'z.js'))).toBe(true)
    expect(existsSync(deadTemp)).toBe(false)
    expect(existsSync(legacyOld)).toBe(false)
    expect(existsSync(join(typesDir, 'tasty-old', 'k.js'))).toBe(false)
    expect(existsSync(join(outDir, 'stale.js'))).toBe(false)
    expect(readFileSync(join(outDir, 'index.js'), 'utf8')).toBe('index v1\n')
    // Swept: the dead temp, the old legacy temp, stale.js, and tasty-old/k.js.
    expect(stats.removed).toBe(4)
  })

  it('commits cleanly when the preserved root has no parent dir yet', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const stage = join(root, 'stage')
    putFile(join(stage, 'index.js'), 'index v1\n')

    const stats = commitStagedDir(stage, outDir, { preserve: [join(outDir, 'types', 'tasty')] })

    expect(stats).toEqual({ committed: 1, skipped: 0, removed: 0 })
    expect(readFileSync(join(outDir, 'index.js'), 'utf8')).toBe('index v1\n')
  })
})

describe('commit leaves a running evaluation its scratch', () => {
  it('keeps fresh scratch, sweeps stranded scratch, and prunes the scratch dir once it is empty', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const scratch = join(outDir, 'tmp')
    const stage = join(root, 'stage')
    putFile(join(stage, 'index.js'), 'index v1\n')
    // Another process has made its eval dir and not yet written its bundle.
    const emptyEval = join(scratch, 'config-eval-fresh0')
    mkdirSync(emptyEval, { recursive: true })
    const freshBundle = join(scratch, 'config-eval-fresh1', 'config.bundle.mjs')
    putFile(freshBundle)
    const stranded = join(scratch, 'fragments-eval-stranded.mjs')
    putFile(stranded)
    backdate(stranded, HOUR_MS)

    commitStagedDir(stage, outDir, { scratch })

    expect(existsSync(emptyEval)).toBe(true)
    expect(existsSync(freshBundle)).toBe(true)
    expect(existsSync(stranded)).toBe(false)

    rmSync(scratch, { recursive: true, force: true })
    mkdirSync(scratch)
    putFile(join(stage, 'index.js'), 'index v2\n')
    commitStagedDir(stage, outDir, { scratch })
    expect(existsSync(scratch)).toBe(false)
  })
})
