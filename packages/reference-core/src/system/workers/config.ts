/**
 * Config worker registration.
 * Owns only event subscriptions and ready signalling.
 */
import { emit, on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunConfig } from '../panda/config/run'

export default async function runConfigWorker(): Promise<never> {
  on('run:system:config', onRunConfig)
  emit('system:config:ready')
  return KEEP_ALIVE
}
