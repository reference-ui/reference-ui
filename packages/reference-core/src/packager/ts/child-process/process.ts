import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveCorePackageDir } from '../../../lib/paths'
import { formatSpawnMonitoredFailure, spawnMonitoredAsync } from '../../../lib/child-process'
import type { TsPackagerCompletionEvent, TsPackagerWorkerPayload } from '../types'

function resolvePackagerTsChildScript(projectCwd: string): string {
  const coreDir = resolveCorePackageDir(projectCwd)
  return join(coreDir, 'dist/cli/packager-ts-child.mjs')
}

/**
 * Run declaration generation in a short-lived Node child so RSS for tsdown/tsc is not
 * charged to the packager-ts worker isolate.
 */
export async function spawnPackagerTsDtsChild(
  payload: TsPackagerWorkerPayload,
  completionEvent: TsPackagerCompletionEvent
): Promise<void> {
  const childScript = resolvePackagerTsChildScript(payload.cwd)
  if (!existsSync(childScript)) {
    throw new Error(
      `packager-ts-child not found at ${childScript}; build @reference-ui/core first`
    )
  }

  // Do not stringify full `payload.config` — large configs exceed argv limits (spawn E2BIG).
  const json = JSON.stringify({
    completionEvent,
    cwd: payload.cwd,
    packages: payload.packages,
  })

  const { code, signal, stderr, stdout } = await spawnMonitoredAsync(
    process.execPath,
    [childScript, json],
    {
      cwd: payload.cwd,
      processName: 'packager-ts-child',
      logCategory: 'packager:ts',
    }
  )

  if (code !== 0) {
    throw new Error(
      formatSpawnMonitoredFailure('packager-ts-child', { code, signal, stderr, stdout })
    )
  }
}
