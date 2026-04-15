/**
 * Config worker registration.
 * Owns only event subscriptions and ready signalling.
 */
import { emit, on } from '../../lib/event-bus'
import { startWorkerMemoryReporter } from '../../lib/profiler'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunConfig } from '../panda/config/run'

export default async function runConfigWorker(): Promise<never> {
  startWorkerMemoryReporter('config')
  on('run:system:config', onRunConfig)
  emit('system:config:ready')
  return KEEP_ALIVE
}
