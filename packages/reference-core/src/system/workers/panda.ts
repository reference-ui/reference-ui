/**
 * Panda worker registration.
 * Owns only event subscriptions and ready signalling.
 */
import { emit, on } from '../../lib/event-bus'
import { startWorkerMemoryReporter } from '../../lib/profiler'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunCodegen, onRunCss } from '../panda/gen'
import { createPandaRunScheduler } from './scheduler'

const PANDA_RUNNERS = {
  codegen: onRunCodegen,
  css: onRunCss,
}

export default async function runPandaWorker(): Promise<never> {
  startWorkerMemoryReporter('panda')
  const scheduleRun = createPandaRunScheduler({ runners: PANDA_RUNNERS })

  // Panda writes shared generated artifacts under one outDir, so keep one
  // run in flight and collapse redundant watch triggers.
  on('run:panda:codegen', () => {
    scheduleRun('codegen')
  })
  on('run:panda:css', () => {
    scheduleRun('css')
  })
  emit('system:panda:ready')
  return KEEP_ALIVE
}
