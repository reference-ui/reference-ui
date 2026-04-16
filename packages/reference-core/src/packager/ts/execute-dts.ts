import { logProfilerSample } from '../../lib/profiler'
import { log } from '../../lib/log'
import { installPackagesTs } from './install'
import type {
  TsPackagerCompletionEvent,
  TsPackagerDtsPayload,
  TsPackagerWorkerPayload,
} from './types'

function dtsPhaseLabel(completionEvent: TsPackagerCompletionEvent): 'runtime' | 'final' {
  return completionEvent === 'packager-ts:runtime:complete' ? 'runtime' : 'final'
}

function getPackagesForRun(
  payload: TsPackagerDtsPayload,
  completionEvent: TsPackagerCompletionEvent
): TsPackagerWorkerPayload['packages'] {
  if (completionEvent === 'packager-ts:runtime:complete') {
    return payload.packages.filter(
      pkg => pkg.name === '@reference-ui/react' || pkg.name === '@reference-ui/system'
    )
  }

  return payload.packages.filter(pkg => pkg.name === '@reference-ui/types')
}

/**
 * Heavy DTS work (install + generated types). Runs in the packager-ts **child** process
 * so the worker thread does not retain tsdown/tsc graph in its isolate.
 */
export async function executePackagerTsDts(
  payload: TsPackagerDtsPayload,
  completionEvent: TsPackagerCompletionEvent
): Promise<void> {
  const { cwd } = payload
  const packages = getPackagesForRun(payload, completionEvent)
  const phase = dtsPhaseLabel(completionEvent)

  log.debug('packager:ts', 'Generating TypeScript declarations...')

  logProfilerSample(`packager-ts:dts:${phase}:before`)
  await installPackagesTs(cwd, packages)
  logProfilerSample(`packager-ts:dts:${phase}:after`)
  log.debug('packager:ts', 'Declarations ready')
}
