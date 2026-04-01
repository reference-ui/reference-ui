import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { getMcpModelPath } from './paths'
import { buildMcpArtifact } from './build'

export interface McpWorkerPayload {
  cwd: string
}

export async function runMcpBuild(payload: McpWorkerPayload): Promise<void> {
  const artifact = await buildMcpArtifact({ cwd: payload.cwd, force: true })

  emit('mcp:complete', {
    modelPath: getMcpModelPath(payload.cwd),
    componentCount: artifact.components.length,
  })
}

export function onRunMcpBuild(payload: McpWorkerPayload): void {
  runMcpBuild(payload).catch(error => {
    const message = error instanceof Error ? error.message : String(error)
    log.error('[mcp] Build failed:', error)
    emit('mcp:failed', { message })
  })
}
