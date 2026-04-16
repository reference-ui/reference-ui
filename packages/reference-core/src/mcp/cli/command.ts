import { loadUserConfig, setConfig, setCwd } from '../../config'
import {
  DEFAULT_REFERENCE_MCP_HOST,
  DEFAULT_REFERENCE_MCP_PORT,
  runReferenceMcpHttpServer,
  runReferenceMcpServer,
} from '../server'

export type McpTransport = 'http' | 'stdio'

export interface McpCommandOptions {
  transport?: string
  port?: number
  host?: string
}

export function resolveTransport(options?: McpCommandOptions): McpTransport {
  const value = options?.transport
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
  const config = await loadUserConfig(cwd)
  setConfig(config)
  setCwd(cwd)

  const transport = resolveTransport(options)

  if (transport === 'stdio') {
    await runReferenceMcpServer({ cwd })
    return
  }

  await runReferenceMcpHttpServer({
    cwd,
    host: options?.host ?? DEFAULT_REFERENCE_MCP_HOST,
    port: options?.port ?? DEFAULT_REFERENCE_MCP_PORT,
  })
}
