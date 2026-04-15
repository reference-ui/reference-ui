import { createWorkerPool } from './create-pool'
import manifest from '../../../workers.json'
import { workerEntries } from './worker-entries'

export const workers = createWorkerPool(manifest)

export { workerEntries }
