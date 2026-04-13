import { emit } from '../../../lib/event-bus'
import {
  getPandaErrorOutput,
  runPandaCodegen,
  runPandaCss,
  unwrapPandaError,
} from './codegen'
import { log } from '../../../lib/log'

export function onRunCodegen(): void {
  runPandaCodegen()
    .then(() => {
      emit('system:panda:css')
      emit('system:panda:codegen')
    })
    .catch((err) => {
      const pandaOutput = getPandaErrorOutput(err)
      const cause = unwrapPandaError(err)

      log.error(
        '[panda] codegen failed (continuing without system/styled). Virtual copy will still run.',
        cause instanceof Error ? cause.message : String(cause)
      )
      if (pandaOutput) {
        log.error('[panda] output:', pandaOutput)
      }
      if (cause instanceof Error && cause.stack) log.debug('panda', cause.stack)
      emit('system:panda:codegen:failed')
    })
}

export function onRunCss(): void {
  runPandaCss()
    .then(() => {
      emit('system:panda:css')
    })
    .catch((err) => {
      const pandaOutput = getPandaErrorOutput(err)
      const cause = unwrapPandaError(err)

      log.error('[panda] css failed:', cause instanceof Error ? cause.message : String(cause))
      if (pandaOutput) {
        log.error('[panda] output:', pandaOutput)
      }
      throw err
    })
}
