import { emit } from '../../../lib/event-bus'
import { runPandaCodegen, runPandaCss } from './codegen'
import { log } from '../../../lib/log'

export function onRunCodegen(): void {
  runPandaCodegen()
    .then(() => {
      emit('system:panda:css')
      emit('system:panda:codegen')
    })
    .catch((err) => {
      log.error(
        '[panda] codegen failed (continuing without system/styled). Virtual copy will still run.',
        err instanceof Error ? err.message : String(err)
      )
      if (err instanceof Error && err.stack) log.debug('panda', err.stack)
      emit('system:panda:codegen:failed')
    })
}

export function onRunCss(): void {
  runPandaCss()
    .then(() => emit('system:panda:css'))
    .catch((err) => {
      log.error('panda', 'onRunCss failed', err)
      throw err
    })
}
