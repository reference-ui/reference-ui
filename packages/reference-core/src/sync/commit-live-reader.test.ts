// Live-reader leg for the staged commit: a worker thread busy-polls readFileSync
// on live files while the main thread commits many rounds whose bytes change
// every time. A changed file flips by rename, which replaces it in place, so no
// read may ever find it missing. The reads run on their own thread so they race
// the commit instead of interleaving with it.

import { once } from 'node:events'
import { mkdirSync, writeFileSync } from 'node:fs'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import { afterEach, describe, expect, it } from 'vitest'
import { commitStagedDir } from './commit.ts'

const FILE_NAMES = ['index.js', 'chunk-a.js', 'chunk-b.js', 'styles.css', 'types.d.ts', 'runtime.js']
const COMMIT_ROUNDS = 60

interface ReaderReport {
  reads: number
  misses: number
  errors: number
}

// Reads each path in a busy loop, counting ENOENT misses, until stopFlag is set.
const READER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads')
const { readFileSync } = require('node:fs')
const { paths, stopFlag } = workerData
const report = { reads: 0, misses: 0, errors: 0 }
do {
  for (const path of paths) {
    report.reads++
    try {
      readFileSync(path)
    } catch (error) {
      if (error.code === 'ENOENT') report.misses++
      else report.errors++
    }
  }
} while (Atomics.load(stopFlag, 0) === 0)
parentPort.postMessage(report)
`

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-commit-reader-'))
  tempDirs.push(dir)
  return dir
}

// Each round stages every file fresh, so the commit sees changed bytes each time.
function stageRound(root: string, round: number): string {
  const stage = join(root, `stage-${round}`)
  mkdirSync(stage, { recursive: true })
  for (const name of FILE_NAMES) writeFileSync(join(stage, name), `${name} round ${round}\n`)
  return stage
}

// Runs `work` while a worker polls the live paths, then returns what it saw.
async function readerWhile(paths: string[], work: () => void): Promise<ReaderReport> {
  const stopFlag = new Int32Array(new SharedArrayBuffer(4))
  const worker = new Worker(READER_SOURCE, { eval: true, workerData: { paths, stopFlag } })
  await once(worker, 'online')
  try {
    work()
  } finally {
    Atomics.store(stopFlag, 0, 1)
  }
  // The listener attaches in the same tick as the stop store, so the reply cannot be missed.
  const [report] = (await once(worker, 'message')) as [ReaderReport]
  await worker.terminate()
  return report
}

describe('staged commit: a live reader never sees a changed file missing', () => {
  it('60 rounds of changed bytes leave every polled read present', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    // Seed the live folder first, so every miss below is a real window, not a file never there.
    commitStagedDir(stageRound(root, 0), outDir)
    const livePaths = FILE_NAMES.map((name) => join(outDir, name))

    const report = await readerWhile(livePaths, () => {
      for (let round = 1; round <= COMMIT_ROUNDS; round += 1) {
        commitStagedDir(stageRound(root, round), outDir)
      }
    })

    expect(report.reads).toBeGreaterThan(COMMIT_ROUNDS)
    expect(report.errors).toBe(0)
    expect(report.misses).toBe(0)
    for (const name of FILE_NAMES) {
      const bytes = await readFile(join(outDir, name), 'utf8')
      expect(bytes).toBe(`${name} round ${COMMIT_ROUNDS}\n`)
    }
  }, 60_000)
})
