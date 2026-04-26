import { emit } from '../../../lib/event-bus'
import {
  getPandaErrorOutput,
  runPandaCodegen,
  runPandaCss,
  unwrapPandaError,
} from './codegen'
import { log } from '../../../lib/log'
import { isPandaCssContractError } from '../../css/transform/demotePandaGlobalCssLayer'

function formatSurfacedError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack?.trim() || `${error.name}: ${error.message}`
  }

  return String(error)
}

function logCodegenFailure(cause: unknown, pandaOutput: string | undefined): void {
  if (isPandaCssContractError(cause)) {
    log.error(
      '[panda] css postprocess failed after codegen. This is not the recoverable watch-artifact mismatch; the Panda CSS contract likely changed. Continuing without system/styled. Virtual copy will still run.',
    )
  } else {
    log.error(
      '[panda] codegen failed before CSS postprocess completed (continuing without system/styled). Virtual copy will still run.',
    )
  }

  log.error('[panda] cause:', formatSurfacedError(cause))
  if (pandaOutput) {
    log.error('[panda] output:', pandaOutput)
  }
}

function logCssFailure(cause: unknown, pandaOutput: string | undefined): void {
  if (isPandaCssContractError(cause)) {
    log.error(
      '[panda] css postprocess failed after cssgen. This is not the recoverable watch-artifact mismatch; the Panda CSS contract likely changed.',
    )
  } else {
    log.error('[panda] css failed:')
  }

  log.error('[panda] cause:', formatSurfacedError(cause))
  if (pandaOutput) {
    log.error('[panda] output:', pandaOutput)
  }
}

export async function onRunCodegen(): Promise<void> {
  try {
    await runPandaCodegen()
    emit('system:panda:css')
    emit('system:panda:codegen')
  } catch (err) {
    const pandaOutput = getPandaErrorOutput(err)
    const cause = unwrapPandaError(err)

    logCodegenFailure(cause, pandaOutput)
    if (cause instanceof Error && cause.stack) log.debug('panda', cause.stack)
    emit('system:panda:codegen:failed')
  }
}

export async function onRunCss(): Promise<void> {
  try {
    await runPandaCss()
    emit('system:panda:css')
  } catch (err) {
    const pandaOutput = getPandaErrorOutput(err)
    const cause = unwrapPandaError(err)

    logCssFailure(cause, pandaOutput)
    throw err
  }
}
