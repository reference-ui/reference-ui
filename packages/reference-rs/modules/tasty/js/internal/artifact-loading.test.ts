/**
 * Retention tests for the default artifact importer over a large manifest module in a temp dir.
 * Thirty imports of one unchanged file must share one module and keep post-GC heap growth bounded, since Node keeps
 * every module record for good. A rewritten file must be read again, and a missing file must still reject.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'

import { afterEach, describe, expect, it } from 'vitest'

import { defaultArtifactImporter } from './artifact-loading.js'

const RUNS = 30
const BUDGET_MB = 4
const MB = 1024 * 1024

setFlagsFromString('--expose-gc')
const gc = runInNewContext('gc') as () => void

function heapAfterGc(): number {
  gc()
  gc()
  return process.memoryUsage().heapUsed
}

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

// A manifest-shaped module of about 400 KB, stamped so a rewrite differs.
function writeManifest(stamp: string, dir?: string): string {
  const root = dir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'tasty-artifact-retention-'))
  if (!dir) tempDirs.push(root)
  const symbols = Array.from({ length: 8000 }, (_, i) => `  "sym${i}": "chunk-${String(i).padStart(6, '0')}.js",`)
  const file = path.join(root, 'manifest.js')
  fs.writeFileSync(file, ['const symbolsByName = {', ...symbols, '}', `export default { stamp: '${stamp}', symbolsByName }`].join('\n'))
  return file
}

function stampOf(moduleValue: unknown): unknown {
  return (moduleValue as { default: { stamp: unknown } }).default.stamp
}

describe('defaultArtifactImporter retention', () => {
  it('imports one unchanged manifest thirty times without retaining each import', async () => {
    const file = writeManifest('a')
    expect(fs.statSync(file).size).toBeGreaterThan(200_000)

    const first = await defaultArtifactImporter(file)
    const before = heapAfterGc()
    let last: unknown
    for (let i = 0; i < RUNS; i += 1) last = await defaultArtifactImporter(file)
    const growthMb = (heapAfterGc() - before) / MB

    expect(growthMb, `${RUNS} imports retained ${growthMb.toFixed(1)} MB`).toBeLessThan(BUDGET_MB)
    expect(last).toBe(first)
  })

  it('reads a rewritten manifest again', async () => {
    const file = writeManifest('a')
    expect(stampOf(await defaultArtifactImporter(file))).toBe('a')

    writeManifest('b', path.dirname(file))
    expect(stampOf(await defaultArtifactImporter(file))).toBe('b')
  })

  it('still rejects for a missing manifest', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasty-artifact-missing-'))
    tempDirs.push(dir)
    await expect(defaultArtifactImporter(path.join(dir, 'manifest.js'))).rejects.toThrow()
  })
})
