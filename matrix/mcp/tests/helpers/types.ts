/**
 * Shared MCP matrix test types and constants.
 *
 * These types mirror the compact JSON payloads asserted by the matrix tests,
 * while the command constant documents the published client entrypoint we boot.
 */
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { ChildProcessByStdio } from 'node:child_process'
import type { Readable } from 'node:stream'

export type McpServerProcess = ChildProcessByStdio<null, Readable, Readable>

export interface RunningMcpClient {
  client: Client
  process?: McpServerProcess
  serverUrl: URL
  transport: StreamableHTTPClientTransport
}

export interface RunningMcpServer {
  process: McpServerProcess
  serverUrl: URL
}

export interface ResourceTextEntry {
  mimeType?: string
  text: string
  uri: string
}

export interface ComponentSummary {
  count: number
  interfaceName: string | null
  kind: 'project' | 'primitive'
  name: string
  observedProps: string[]
  propCount: number
  source: string
  styleProps: {
    supported: boolean
    tool: 'get_style_props'
  }
}

export interface ComponentModel {
  components: ComponentSummary[]
  generatedAt: string
  schemaVersion: number
}

export interface ComponentReadout {
  interface: { name: string; source: string } | null
  kind: 'project' | 'primitive'
  name: string
  propSummary: {
    documented: number
    observed: number
    returned: number
    style: number
    total: number
  }
  props: Array<{ name: string; origin?: string; styleProp?: boolean; type: string | null }>
  source: string
  styleProps: {
    supported: boolean
    tool: 'get_style_props'
  }
}

export interface TokenReadout {
  availableCategories?: string[]
  compressed: boolean
  message?: string
  returned: number
  tokens: Array<{
    category: string
    dark?: unknown
    description?: string
    light?: unknown
    path: string
    value?: unknown
  }>
  total: number
}

export const MATRIX_MCP_TIMEOUT_MS = 120_000
export const MATRIX_MCP_NPX_COMMAND = [
  'npx',
  '--yes',
  '--package=@reference-ui/core@latest',
  'mcp',
] as const
