import { formatHeapPieLogLines, initProfilerHeapAggregateListener, publishProfilerHeapSample } from './aggregate'
import { initProfilerChildRssRegistry } from './child-rss'
import { log } from '../log'
import { captureMemorySnapshot, formatProfilerLine } from './memory'
import { isMemoryProfilerEnabled } from './env'

const INTERVAL_MS = 3000

let timer: NodeJS.Timeout | undefined

function logMainProfilerTick(): void {
  const snap = captureMemorySnapshot('sync-main')
  publishProfilerHeapSample('sync-main', snap.heapUsedBytes ?? 0)
  log.info('[profiler] ' + formatProfilerLine(snap))
  for (const row of formatHeapPieLogLines()) {
    log.info('[profiler] ' + row)
  }
}

export function startMainMemoryProfiler(): void {
  if (!isMemoryProfilerEnabled() || timer) return

  initProfilerHeapAggregateListener()
  initProfilerChildRssRegistry()
  logMainProfilerTick()
  timer = setInterval(logMainProfilerTick, INTERVAL_MS)
}

export function stopMainMemoryProfiler(): void {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
  if (isMemoryProfilerEnabled()) {
    logMainProfilerTick()
  }
}
