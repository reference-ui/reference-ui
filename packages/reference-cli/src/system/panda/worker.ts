/**
 * Panda worker – runs Panda codegen and cssgen when requested.
 * Listens: run:panda:codegen (full), run:panda:css (css only).
 */
import { emit, on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunCodegen, onRunCss } from './index'

export default async function runPanda(): Promise<never> {
  on('run:panda:codegen', onRunCodegen)
  on('run:panda:css', onRunCss)
  emit('system:panda:ready')
  return KEEP_ALIVE
}
