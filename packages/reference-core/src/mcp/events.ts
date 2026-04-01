export type McpEvents = {
  'mcp:ready': Record<string, never>
  'run:mcp:build': Record<string, never>
  'mcp:complete': { modelPath: string; componentCount: number }
  'mcp:failed': { message: string }
}
