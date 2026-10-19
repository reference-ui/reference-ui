// Tool-result formatters shared by every MCP tool.
// They take payloads and emit text results, error results, and the public model projection
// served over resources.
import { listComponents } from '../pipeline/queries'
import type { McpBuildArtifact, McpPublicModel } from '../pipeline/types'

export function toTextResult<T extends Record<string, unknown>>(payload: T) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  }
}

export function toErrorResult(message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true,
  }
}

export function toPublicModel(artifact: McpBuildArtifact): McpPublicModel {
  return {
    schemaVersion: artifact.schemaVersion,
    generatedAt: artifact.generatedAt,
    components: listComponents(artifact, { limit: 500 }),
  }
}
