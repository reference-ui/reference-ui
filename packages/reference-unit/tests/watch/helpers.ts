import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pkgRoot, waitFor } from '../virtual/helpers'

const REF_SYNC_READY_MESSAGE = '[ref sync] ready'
export const watchLogPath = join(pkgRoot, '.ref-sync-watch.log')

function getReadyCount(): number {
  if (!existsSync(watchLogPath)) return 0
  const content = readFileSync(watchLogPath, 'utf-8')
  return content.split(REF_SYNC_READY_MESSAGE).length - 1
}

export async function waitForNextWatchReady(timeoutMs = 15_000): Promise<boolean> {
  const baselineCount = getReadyCount()
  return waitFor(() => getReadyCount() > baselineCount, { timeoutMs, intervalMs: 100 })
}
