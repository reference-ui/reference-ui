/**
 * Config worker – runs config generation when requested.
 * Listens: run:system:config. Logic in runConfig.onRunConfig.
 */
import { emit, on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunConfig } from './runConfig'

export default async function runConfigWorker(): Promise<never> {
  on('run:system:config', onRunConfig)
  emit('system:config:ready')
  return KEEP_ALIVE
}
