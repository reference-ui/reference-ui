import { emit, on } from '../../lib/event-bus'
import { startWorkerMemoryReporter } from '../../lib/profiler'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunMcpAtlasPrefetch, onRunMcpBuild, type McpWorkerPayload } from './run'

export default async function runMcpWorker(payload: McpWorkerPayload): Promise<never> {
  startWorkerMemoryReporter('mcp')
  on('run:mcp:prefetch:atlas', () => onRunMcpAtlasPrefetch(payload))
  on('run:mcp:build', () => onRunMcpBuild(payload))
  emit('mcp:ready', {})

  return KEEP_ALIVE
}
