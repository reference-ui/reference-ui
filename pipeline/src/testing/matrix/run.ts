/**
 * Public matrix runner entrypoint.
 *
 * The implementation lives under `matrix/runner/*`; this file stays small so
 * callers can keep importing the stable path while the runner internals evolve.
 */

import { fileURLToPath } from 'node:url'
import { runMatrixTests } from './runner/run.js'

export { runMatrixBootstrapInDagger, runMatrixTests } from './runner/run.js'
export type { MatrixRunOptions } from './runner/types.js'

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runMatrixTests({ commandLabel: 'pnpm pipeline:test:matrix' })
}