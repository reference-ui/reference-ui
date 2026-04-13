import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pkgRoot, waitFor } from '../virtual/helpers'

const sessionPath = join(pkgRoot, '.reference-ui', 'session.json')

function getReadyMarker(): string | null {
  if (!existsSync(sessionPath)) return null
  try {
    const session = JSON.parse(readFileSync(sessionPath, 'utf-8')) as {
      buildState?: string
      updatedAt?: string
    }
    if (session.buildState !== 'ready') return null
    return session.updatedAt ?? null
  } catch {
    return null
  }
}

export async function waitForNextWatchReady(timeoutMs = 15_000): Promise<boolean> {
  const baselineMarker = getReadyMarker()
  return waitFor(() => {
    const nextMarker = getReadyMarker()
    return nextMarker !== null && nextMarker !== baselineMarker
  }, { timeoutMs, intervalMs: 100 })
}
