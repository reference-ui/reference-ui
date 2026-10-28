/**
 * Tests that a build swaps its artifacts atomically: a reader polling in a worker never sees the
 * manifest or runtime missing across rebuilds, and no temp directory from another process leaks.
 * Tests that an unchanged rebuild touches nothing and a changed one lands only the differing files.
 */
import { once } from 'node:events'
import { cp, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

import { describe, expect, it } from 'vitest'

import { buildTasty } from './build.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..')
const tastyDir = join(packageDir, 'tasty', 'tests')

interface PollOptions {
  paths: string[]
  tempParent: string
  tempPrefix: string
}

interface PollReport {
  misses: number
  errors: number
  polls: number
  tempNames: string[]
}

/**
 * Worker body for pollWhile. It stats each path in a busy loop, counting ENOENT misses,
 * and records entries in tempParent starting with tempPrefix, until stopFlag is set.
 */
const POLLING_READER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads')
const { readdirSync, statSync } = require('node:fs')
const { paths, tempParent, tempPrefix, stopFlag } = workerData
const report = { misses: 0, errors: 0, polls: 0 }
const tempNames = new Set()
do {
  for (const path of paths) {
    report.polls++
    try {
      statSync(path)
    } catch (error) {
      if (error.code === 'ENOENT') report.misses++
      else report.errors++
    }
  }
  try {
    for (const name of readdirSync(tempParent)) {
      if (name.startsWith(tempPrefix)) tempNames.add(name)
    }
  } catch (error) {
    report.errors++
  }
} while (Atomics.load(stopFlag, 0) === 0)
parentPort.postMessage({ ...report, tempNames: [...tempNames] })
`

/** Runs `work` while a worker polls the paths, then returns what the worker saw. */
async function pollWhile(
  options: PollOptions,
  work: () => Promise<void>
): Promise<PollReport> {
  const stopFlag = new Int32Array(new SharedArrayBuffer(4))
  const worker = new Worker(POLLING_READER_SOURCE, {
    eval: true,
    workerData: { ...options, stopFlag },
  })
  await once(worker, 'online')

  try {
    await work()
  } finally {
    Atomics.store(stopFlag, 0, 1)
  }
  // Listening starts in the same tick as the store, so the worker's reply cannot be missed.
  const [report] = (await once(worker, 'message')) as [PollReport]
  await worker.terminate()
  return report
}

/** Maps every file under dir, keyed by its '/'-joined relative path, to its utf-8 contents. */
async function readTree(dir: string, prefix = ''): Promise<Map<string, string>> {
  const tree = new Map<string, string>()
  for (const entry of await readdir(join(dir, prefix), { withFileTypes: true })) {
    const key = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      for (const [nestedKey, contents] of await readTree(dir, key)) {
        tree.set(nestedKey, contents)
      }
    } else {
      tree.set(key, await readFile(join(dir, key), 'utf-8'))
    }
  }
  return tree
}

/** Builds one fixture into outputDir and returns the resulting tree. */
async function buildTree(
  outputDir: string,
  include: string[]
): Promise<Map<string, string>> {
  await buildTasty({ rootDir: tastyDir, include, outputDir })
  return readTree(outputDir)
}

interface FileStamp {
  ino: number
  mtimeMs: number
}

/** Maps every file under dir to its inode and mtime. */
async function stampTree(dir: string): Promise<Map<string, FileStamp>> {
  const stamps = new Map<string, FileStamp>()
  for (const key of (await readTree(dir)).keys()) {
    const { ino, mtimeMs } = await stat(join(dir, key))
    stamps.set(key, { ino, mtimeMs })
  }
  return stamps
}

/** The parent dir's mtime and sorted entry names: both move when a temp dir comes and goes. */
async function snapshotDir(dir: string): Promise<{ mtimeMs: number; names: string[] }> {
  return { mtimeMs: (await stat(dir)).mtimeMs, names: (await readdir(dir)).sort() }
}

describe('buildTasty', () => {
  it('an unchanged rebuild leaves every file and the parent dir untouched', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-noop-'))
    const outputDir = join(tempRoot, 'tasty-output')
    const include = ['cases/TST-IMP-06/input/**/*.{ts,tsx,mts,cts}']

    try {
      await buildTasty({ rootDir: tastyDir, include, outputDir })
      const stamps = await stampTree(outputDir)
      const parent = await snapshotDir(tempRoot)
      expect(stamps.size).toBeGreaterThan(1)

      // Past the filesystem's timestamp granularity, so any write would move an mtime.
      await new Promise(done => setTimeout(done, 25))
      await buildTasty({ rootDir: tastyDir, include, outputDir })

      expect(await stampTree(outputDir)).toEqual(stamps)
      expect(await snapshotDir(tempRoot)).toEqual(parent)
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('editing one source lands only the files whose bytes changed', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-delta-'))
    const rootDir = join(tempRoot, 'project')
    const outputDir = join(tempRoot, 'tasty-output')
    const include = ['src/**/*.{ts,tsx,mts,cts}']

    try {
      await cp(join(tastyDir, 'cases', 'TST-IMP-06', 'input'), join(rootDir, 'src'), {
        recursive: true,
      })
      await buildTasty({ rootDir, include, outputDir })
      const beforeTree = await readTree(outputDir)
      const beforeStamps = await stampTree(outputDir)

      await new Promise(done => setTimeout(done, 25))
      await writeFile(
        join(rootDir, 'src', 'icon.ts'),
        'export interface IconProps {\n  glyph: number\n}\n'
      )
      await buildTasty({ rootDir, include, outputDir })
      const afterTree = await readTree(outputDir)
      const afterStamps = await stampTree(outputDir)

      const unchanged = [...afterTree.keys()].filter(
        key => beforeTree.get(key) === afterTree.get(key)
      )
      const changed = [...afterTree.keys()].filter(key => !unchanged.includes(key))
      expect(changed.length).toBeGreaterThan(0)
      expect(unchanged.length).toBeGreaterThan(0)
      for (const key of unchanged) expect(afterStamps.get(key)).toEqual(beforeStamps.get(key))
      expect((await readdir(tempRoot)).sort()).toEqual(['project', 'tasty-output'])
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('a polling reader never sees the manifest missing across rebuilds', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-swap-'))
    const outputDir = join(tempRoot, 'tasty-output')
    const includeA = ['cases/TST-EXT-01/input/**/*.{ts,tsx}']
    const includeB = ['cases/TST-GEN-01/input/**/*.{ts,tsx}']

    try {
      const treeA = await buildTree(join(tempRoot, 'ref-a'), includeA)
      const treeB = await buildTree(join(tempRoot, 'ref-b'), includeB)
      const onlyInB = [...treeB.keys()].filter(key => !treeA.has(key))
      expect(treeB.get('manifest.js')).not.toBe(treeA.get('manifest.js'))
      expect(onlyInB.length).toBeGreaterThan(0)

      // Seed the live dir so the reader starts from a valid manifest.
      await buildTasty({ rootDir: tastyDir, include: includeA, outputDir })

      const report = await pollWhile(
        {
          paths: [join(outputDir, 'manifest.js'), join(outputDir, 'runtime.js')],
          tempParent: tempRoot,
          tempPrefix: 'tasty-output.tmp-',
        },
        async () => {
          for (let index = 0; index < 20; index++) {
            await buildTasty({
              rootDir: tastyDir,
              include: index % 2 === 0 ? includeB : includeA,
              outputDir,
            })
          }
        }
      )

      expect(report.errors).toBe(0)
      expect(report.misses).toBe(0)
      expect(report.polls).toBeGreaterThan(0)

      // Requires at least one sampled temp dir, or the pid check would pass vacuously.
      expect(report.tempNames.length).toBeGreaterThan(0)
      for (const name of report.tempNames) {
        expect(name.startsWith(`tasty-output.tmp-${process.pid}-`)).toBe(true)
      }

      // The last build is fixture A, so fixture B's files must be gone.
      const finalTree = await readTree(outputDir)
      expect([...finalTree.keys()].filter(key => onlyInB.includes(key))).toEqual([])
      expect(finalTree).toEqual(treeA)
      expect((await readdir(tempRoot)).sort()).toEqual(['ref-a', 'ref-b', 'tasty-output'])
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  }, 60_000)
})
