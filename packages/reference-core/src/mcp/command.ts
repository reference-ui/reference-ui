import { loadUserConfig, setConfig, setCwd } from '../config'
import {
  DEFAULT_REFERENCE_MCP_HOST,
  DEFAULT_REFERENCE_MCP_PORT,
  runReferenceMcpHttpServer,
  runReferenceMcpServer,
} from './server'

export type McpTransport = 'http' | 'stdio'

export interface McpCommandOptions {
  rebuild?: boolean
  transport?: string
  port?: number
  host?: string
}

function getTransport(value?: string): McpTransport {
  if (!value) {
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

  const transport = getTransport(options?.transport)

  if (transport === 'stdio') {
    await runReferenceMcpServer({
      cwd,
      forceBuild: options?.rebuild,
    })
    return
  }

  await runReferenceMcpHttpServer({
    cwd,
    forceBuild: options?.rebuild,
    host: options?.host ?? DEFAULT_REFERENCE_MCP_HOST,
    port: options?.port ?? DEFAULT_REFERENCE_MCP_PORT,
  })
}
