/**
 * Virtual worker – wires virtual event-bus triggers to the run handlers.
 * Listens: run:virtual:copy:all (full), run:virtual:sync:file (single file, from watch:change).
 */
import { emit, on } from '../lib/event-bus'
import { startWorkerMemoryReporter } from '../lib/profiler'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { onRunVirtualCopyAll, onRunVirtualSyncFile } from './run'
import type { VirtualWorkerPayload } from './types'

export default async function runVirtual(payload: VirtualWorkerPayload): Promise<never> {
  startWorkerMemoryReporter('virtual')

  on('run:virtual:copy:all', () => onRunVirtualCopyAll(payload))
  on('run:virtual:sync:file', (event) => onRunVirtualSyncFile(payload, event))
  emit('virtual:ready')

  return KEEP_ALIVE
}
