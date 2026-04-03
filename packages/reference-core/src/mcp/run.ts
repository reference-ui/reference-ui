import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { getMcpModelPath } from './paths'
import { buildMcpArtifact, prefetchMcpAtlas } from './build'

export interface McpWorkerPayload {
  cwd: string
}

export async function runMcpBuild(payload: McpWorkerPayload): Promise<void> {
  const startedAt = Date.now()
  const artifact = await buildMcpArtifact({ cwd: payload.cwd, force: true })
  const durationMs = Date.now() - startedAt

  log.debug('mcp', 'MCP build completed', {
    cwd: payload.cwd,
    componentCount: artifact.components.length,
    modelPath: getMcpModelPath(payload.cwd),
    durationMs,
  })

  emit('mcp:complete', {
    modelPath: getMcpModelPath(payload.cwd),
    componentCount: artifact.components.length,
  })
}

export async function runMcpAtlasPrefetch(payload: McpWorkerPayload): Promise<void> {
  await prefetchMcpAtlas({ cwd: payload.cwd, refresh: true })
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
