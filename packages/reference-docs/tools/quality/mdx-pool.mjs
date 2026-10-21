// Worker pool for the docs gate's MDX compile. It takes the page paths and emits the compile result
// for every page, compiled in parallel: each worker thread loads the app's pipeline once and takes
// every Nth page. Small runs (a few pages) skip the pool, since a worker costs about as much to start
// as the pages it would compile.
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

const WORKER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mdx-worker.mjs')
const MAX_LANES = 4
const MIN_PAGES_FOR_POOL = 16

/** How many worker threads to use for `pageCount` pages; 1 means compile in-process. */
export function laneCount(pageCount) {
  if (pageCount < MIN_PAGES_FOR_POOL) return 1
  return Math.min(MAX_LANES, os.availableParallelism())
}

/** Compiles every file across `lanes` workers; resolves to a Map from file to compile result. */
export async function compilePool(files, lanes) {
  const results = new Map()
  const lanesDone = []
  for (let lane = 0; lane < lanes; lane++) {
    const chunk = files.filter((_, index) => index % lanes === lane)
    lanesDone.push(runLane(chunk, results))
  }
  await Promise.all(lanesDone)
  return results
}

function runLane(chunk, results) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER, { workerData: { files: chunk } })
    worker.on('message', ({ file, result }) => results.set(file, result))
    worker.on('error', reject)
    worker.on('exit', code =>
      code === 0 ? resolve() : reject(new Error(`mdx worker exited with ${code}`))
    )
  })
}
