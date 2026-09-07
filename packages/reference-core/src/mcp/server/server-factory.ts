import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { loadReferenceMcpInstructions } from './instructions'
import type { McpModelState } from './model-state'
import { ProjectManager } from './project-manager'
import { registerReferenceResources } from './resources'
import { registerReferenceTools } from './tools'

export interface CreateReferenceMcpServerOptions {
  cwd: string
  projectManager?: ProjectManager
  modelState?: McpModelState
}

export function createReferenceMcpServer(
  options: CreateReferenceMcpServerOptions
): McpServer {
  const projectManager = options.projectManager ?? new ProjectManager(options.cwd)
  const instructions = loadReferenceMcpInstructions(options.cwd)

  const server = new McpServer(
    {
      name: 'reference-ui',
      title: 'Reference UI',
      version: '0.0.3',
      description:
        'Atlas- and generated-types-backed component intelligence for Reference UI projects.',
    },
    {
      instructions,
    }
  )

  registerReferenceTools(server, projectManager)
  registerReferenceResources(server, projectManager, instructions)

  return server
}
