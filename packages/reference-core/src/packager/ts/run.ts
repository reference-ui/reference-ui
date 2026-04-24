import { emit } from '../../lib/event-bus'
import { log } from '../../lib/log'
import { executeDts } from './execute-dts'
import type { RunPackagerTsPayload } from './types'

export async function runPackagerTs(payload: RunPackagerTsPayload): Promise<void> {
  await executeDts(payload)
  emit(payload.completionEvent, {})
}

export function onRunPackagerTs(payload: RunPackagerTsPayload): void {
  if (!payload.cwd) {
    log.error('[packager-ts] run:packager-ts: payload.cwd is undefined')
    emit('packager-ts:failed', {})
    return
  }

  runPackagerTs(payload).catch((error) => {
    log.error('[packager-ts] Declaration generation failed:', error)
    emit('packager-ts:failed', {})
  })
}
