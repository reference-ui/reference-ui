export type McpEvents = {
  'mcp:ready': Record<string, never>
  'run:mcp:prefetch:atlas': Record<string, never>
  /** Emitted after the prefetch child exits (success or failure) so sync can run MCP build without overlapping packager-ts. */
  'mcp:prefetch:atlas:complete': Record<string, never>
  'run:mcp:build': Record<string, never>
  'mcp:complete': { modelPath: string; componentCount: number }
  'mcp:failed': { message: string }
}
