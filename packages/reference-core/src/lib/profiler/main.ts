import { log } from '../log'
import { captureMemorySnapshot, formatProfilerLine } from './memory'
import { isMemoryProfilerEnabled } from './env'

const INTERVAL_MS = 3000

let timer: NodeJS.Timeout | undefined

export function startMainMemoryProfiler(): void {
  if (!isMemoryProfilerEnabled() || timer) return

  log.info(formatProfilerLine(captureMemorySnapshot('sync-main')))
  timer = setInterval(() => {
    log.info(formatProfilerLine(captureMemorySnapshot('sync-main')))
  }, INTERVAL_MS)
}

export function stopMainMemoryProfiler(): void {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
  if (isMemoryProfilerEnabled()) {
    log.info(formatProfilerLine(captureMemorySnapshot('sync-main')))
  }
}
