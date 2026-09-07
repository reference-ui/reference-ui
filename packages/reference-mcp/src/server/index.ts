import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { log } from './logger'
import {
  DEFAULT_REFERENCE_MCP_HOST,
  DEFAULT_REFERENCE_MCP_PATH,
  DEFAULT_REFERENCE_MCP_PORT,
  REFERENCE_MCP_READY_PREFIX,
  createReferenceMcpHttpServer,
  runReferenceMcpHttpServer,
  type RunReferenceMcpHttpServerOptions,
} from './http'
import {
  createMcpModelState,
  McpProjectModelState,
  type McpModelState,
  type ProjectError,
} from './model-state'
import { ProjectManager } from './project-manager'
import {
  REFERENCE_MCP_COMPONENT_MODEL_URI,
  REFERENCE_MCP_GETTING_STARTED_URI,
  REFERENCE_MCP_INSTRUCTIONS_URI,
} from './resources'
import {
  createReferenceMcpServer,
  type CreateReferenceMcpServerOptions,
} from './server-factory'

export {
  createMcpModelState,
  McpProjectModelState,
  type McpModelState,
  type ProjectError,
}

export { ProjectManager }

export {
  createReferenceMcpServer,
  type CreateReferenceMcpServerOptions,
  createReferenceMcpHttpServer,
  runReferenceMcpHttpServer,
  type RunReferenceMcpHttpServerOptions,
}

export {
  DEFAULT_REFERENCE_MCP_PORT,
  DEFAULT_REFERENCE_MCP_HOST,
  DEFAULT_REFERENCE_MCP_PATH,
  REFERENCE_MCP_READY_PREFIX,
  REFERENCE_MCP_INSTRUCTIONS_URI,
  REFERENCE_MCP_GETTING_STARTED_URI,
  REFERENCE_MCP_COMPONENT_MODEL_URI,
}

export async function runReferenceMcpServer(options: {
  cwd: string
  project?: string
}): Promise<void> {
  const projectManager = new ProjectManager(options.cwd, { project: options.project })
  const server = createReferenceMcpServer({
    cwd: options.cwd,
    projectManager,
  })
  const transport = new StdioServerTransport()
  await server.connect(transport)

  // Resilient non-blocking boot: initialize in background after handshake completes
  projectManager.initialize().catch(err => {
    log.warn('[mcp] Background project discovery warning:', err)
  })
}
