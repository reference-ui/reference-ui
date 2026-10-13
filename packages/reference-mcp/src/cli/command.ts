import {
  DEFAULT_REFERENCE_MCP_HOST,
  DEFAULT_REFERENCE_MCP_PORT,
  runReferenceMcpHttpServer,
  runReferenceMcpServer,
} from '../server'

export type McpTransport = 'http' | 'stdio'

export interface McpCommandOptions {
  transport?: string
  http?: boolean
  port?: number
  host?: string
  project?: string
}

// Explicit --transport wins; --http is shorthand; a bare --port or --host implies http.
export function resolveTransport(options?: McpCommandOptions): McpTransport {
  const value = options?.transport
  if (options?.http) {
    if (value && value !== 'http') {
      throw new Error(`--http conflicts with --transport ${value}`)
    }
    return 'http'
  }
  if (!value) {
    if (options?.port !== undefined || options?.host !== undefined) {
      return 'http'
    }
    return 'stdio'
  }

  if (value === 'http' || value === 'stdio') {
    return value
  }

  throw new Error(`Unsupported MCP transport: ${value}`)
}

export async function mcpCommand(
  cwd: string,
  options?: McpCommandOptions
): Promise<void> {
  const transport = resolveTransport(options)
  const project = options?.project ?? process.env.REF_PROJECT

  if (transport === 'stdio') {
    await runReferenceMcpServer({ cwd, project })
    return
  }

  await runReferenceMcpHttpServer({
    cwd,
    project,
    host: options?.host ?? DEFAULT_REFERENCE_MCP_HOST,
    port: options?.port ?? DEFAULT_REFERENCE_MCP_PORT,
  })
}
