// Package entry for @reference-ui/mcp.
// It takes nothing and emits the server factories and runners, the CLI command, the
// project manager, the model state, and the shared pipeline types.
export {
  createReferenceMcpServer,
  createReferenceMcpHttpServer,
  runReferenceMcpServer,
  runReferenceMcpHttpServer,
  type CreateReferenceMcpServerOptions,
  type RunReferenceMcpHttpServerOptions,
} from './server'

export { mcpCommand, type McpCommandOptions, type McpTransport } from './cli/command'
export { ProjectManager } from './server/project-manager'
export { McpProjectModelState, createMcpModelState, type McpModelState } from './server/model-state'
export * from './pipeline/types'
