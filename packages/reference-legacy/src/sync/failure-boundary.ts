import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { shutdownAndExit } from './shutdown'

let syncFailureBoundaryInstalled = false

function formatUnexpectedSyncFailure(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason
  }

  return new Error(String(reason))
}

export function createUnexpectedSyncFailureHandler(
  source: 'uncaughtException' | 'unhandledRejection'
): (reason: unknown) => void {
  return (reason: unknown) => {
    const error = formatUnexpectedSyncFailure(reason)
    log.error(`[sync] Unhandled ${source}`, error)
    emit('sync:failed', {})
    void shutdownAndExit(1, source)
  }
}

export function initGlobalSyncFailureBoundary(): void {
  if (syncFailureBoundaryInstalled) return

  syncFailureBoundaryInstalled = true
  process.once('uncaughtException', createUnexpectedSyncFailureHandler('uncaughtException'))
  process.once('unhandledRejection', createUnexpectedSyncFailureHandler('unhandledRejection'))
}