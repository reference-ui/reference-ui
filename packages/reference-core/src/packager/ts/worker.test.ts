import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-ts-worker-'))
  createdDirs.push(dir)
  return dir
}

async function importWorkerWithMockedOutDir(outDir: string) {
  vi.resetModules()
  vi.doMock('../../lib/paths/out-dir', () => ({
    getOutDirPath: () => outDir,
  }))
  const mod = await import('./worker')
  vi.doUnmock('../../lib/paths/out-dir')
  return mod
}

afterEach(() => {
  vi.resetModules()
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('packager/ts/worker', () => {
  it('hasAllBundleOutputs returns false when no packages', async () => {
    const outDir = createTempDir()
    const { hasAllBundleOutputs: check } = await importWorkerWithMockedOutDir(outDir)
    expect(check(outDir, [])).toBe(false)
  })

  it('hasAllBundleOutputs returns false when one package output is missing', async () => {
    const outDir = createTempDir()
    const reactDir = join(outDir, 'react')
    mkdirSync(reactDir, { recursive: true })
    writeFileSync(join(reactDir, 'react.mjs'), '')
    const { hasAllBundleOutputs: check } = await importWorkerWithMockedOutDir(outDir)
    expect(
      check(outDir, [
        { name: '@reference-ui/react', sourceEntry: 'src/entry/react.ts', outFile: 'react.mjs' },
        { name: '@reference-ui/system', sourceEntry: 'src/entry/system.ts', outFile: 'system.mjs' },
      ])
    ).toBe(false)
  })

  it('hasAllBundleOutputs returns true when every package output exists', async () => {
    const outDir = createTempDir()
    mkdirSync(join(outDir, 'react'), { recursive: true })
    mkdirSync(join(outDir, 'system'), { recursive: true })
    writeFileSync(join(outDir, 'react', 'react.mjs'), '')
    writeFileSync(join(outDir, 'system', 'system.mjs'), '')
    const { hasAllBundleOutputs: check } = await importWorkerWithMockedOutDir(outDir)
    expect(
      check(outDir, [
        { name: '@reference-ui/react', sourceEntry: 'src/entry/react.ts', outFile: 'react.mjs' },
        { name: '@reference-ui/system', sourceEntry: 'src/entry/system.ts', outFile: 'system.mjs' },
      ])
    ).toBe(true)
  })
})
