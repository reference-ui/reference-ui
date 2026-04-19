/**
 * Panda worker registration.
 * Owns only event subscriptions and ready signalling.
 */
import { emit, on } from '../../lib/event-bus'
import { startWorkerMemoryReporter } from '../../lib/profiler'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunCodegen, onRunCss } from '../panda/gen'

export default async function runPandaWorker(): Promise<never> {
  startWorkerMemoryReporter('panda')
  on('run:panda:codegen', onRunCodegen)
  on('run:panda:css', onRunCss)
  emit('system:panda:ready')
  return KEEP_ALIVE
}
