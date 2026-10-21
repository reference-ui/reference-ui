// Worker thread for the docs gate's MDX pool. It takes its page paths from workerData, compiles each
// with the shared compiler from mdx-compile.mjs, and posts { file, result } back to the main thread.
import { readFile } from 'node:fs/promises'
import { parentPort, workerData } from 'node:worker_threads'
import { loadCompiler } from './mdx-compile.mjs'

const compiler = await loadCompiler()
for (const file of workerData.files) {
  const result = await compiler.compile(file, await readFile(file, 'utf8'))
  parentPort.postMessage({ file, result })
}
