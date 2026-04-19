import { emit } from '../../lib/event-bus'
import { log } from '../../lib/log'
import { spawnMcpBuildChild, spawnMcpPrefetchAtlasChild } from './child-process/process'

export interface McpWorkerPayload {
  cwd: string
}

export async function runMcpBuild(payload: McpWorkerPayload): Promise<void> {
  const startedAt = Date.now()
  const { modelPath, componentCount } = await spawnMcpBuildChild(payload.cwd)
  const durationMs = Date.now() - startedAt

  log.debug('mcp', 'MCP build completed', {
    cwd: payload.cwd,
    componentCount,
    modelPath,
    durationMs,
  })

  emit('mcp:complete', {
    modelPath,
    componentCount,
  })
}

export async function runMcpAtlasPrefetch(payload: McpWorkerPayload): Promise<void> {
  try {
    await spawnMcpPrefetchAtlasChild(payload.cwd)
  } finally {
    emit('mcp:prefetch:atlas:complete', {})
  }
}

export function onRunMcpBuild(payload: McpWorkerPayload): void {
  runMcpBuild(payload).catch(error => {
    const message = error instanceof Error ? error.message : String(error)
    log.error('[mcp] Build failed:', error)
    emit('mcp:failed', { message })
  })
}

export function onRunMcpAtlasPrefetch(payload: McpWorkerPayload): void {
  runMcpAtlasPrefetch(payload).catch(error => {
    log.debug('[mcp] Atlas prefetch failed:', error)
  })
}
