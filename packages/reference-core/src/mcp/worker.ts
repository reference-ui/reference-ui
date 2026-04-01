import { emit, on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { onRunMcpBuild, type McpWorkerPayload } from './run'

export default async function runMcpWorker(payload: McpWorkerPayload): Promise<never> {
  on('run:mcp:build', () => onRunMcpBuild(payload))
  emit('mcp:ready', {})

  return KEEP_ALIVE
}
