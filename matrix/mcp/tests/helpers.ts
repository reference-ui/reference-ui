/**
 * Shared test harness for the matrix MCP fixture.
 *
 * These tests intentionally start the published `@reference-ui/core` MCP bin
 * through `npx --package=@reference-ui/core@latest mcp`, matching the command a
 * downstream consumer should use. The helpers also prebuild the cached MCP
 * artifact and provide small parsers/types for MCP text/resource responses.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import type { Readable } from 'node:stream'

type McpServerProcess = ChildProcessByStdio<null, Readable, Readable>

export interface RunningMcpClient {
  client: Client
  process: McpServerProcess
  serverUrl: URL
  transport: StreamableHTTPClientTransport
}

interface TextContentEntry {
  type: 'text'
  text: string
}

export interface ResourceTextEntry {
  mimeType?: string
  text: string
  uri: string
}

export interface ComponentSummary {
  count: number
  interfaceName: string | null
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
  tokens: Array<{
    category: string
    dark?: unknown
    description?: string
    path: string
    value?: unknown
  }>
}

export const MATRIX_MCP_TIMEOUT_MS = 120_000
export const MATRIX_MCP_NPX_COMMAND = [
  'npx',
  '--yes',
  '--package=@reference-ui/core@latest',
  'mcp',
] as const

function resolveInstalledMcpChildPath(cwd: string): string {
  return join(cwd, 'node_modules', '@reference-ui', 'core', 'dist', 'cli', 'mcp-child.mjs')
}

export async function buildMcpArtifactCache(cwd: string): Promise<void> {
  const childScript = resolveInstalledMcpChildPath(cwd)

  if (!existsSync(childScript)) {
    throw new Error(`Expected installed MCP child script at ${childScript}`)
  }

  await new Promise<void>((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const child = spawn(process.execPath, [childScript, JSON.stringify({ kind: 'build', cwd })], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })

    child.once('error', error => {
      reject(error)
    })

    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(
        new Error(
          [
            `mcp-child build failed (code=${code}, signal=${signal})`,
            '',
            'stdout:',
            stdout.trim() || '(empty)',
            '',
            'stderr:',
            stderr.trim() || '(empty)',
          ].join('\n'),
        ),
      )
    })
  })
}

export function findTextContent(result: unknown): string {
  const content = (result as { content?: unknown }).content
  if (!Array.isArray(content)) {
    return ''
  }

  const match = content.find(
    (entry): entry is TextContentEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      (entry as { type?: unknown }).type === 'text' &&
      typeof (entry as { text?: unknown }).text === 'string',
  )

  return match?.text ?? ''
}

export function findTextResource(result: unknown): ResourceTextEntry | null {
  const contents = (result as { contents?: unknown }).contents
  if (!Array.isArray(contents)) {
    return null
  }

  return (
    contents.find(
      (entry): entry is ResourceTextEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { uri?: unknown }).uri === 'string' &&
        typeof (entry as { text?: unknown }).text === 'string',
    ) ?? null
  )
}

export function parseTextJson<T>(result: unknown): T {
  const text = findTextContent(result)

  if (!text) {
    throw new Error('Expected MCP response to include a text payload.')
  }

  return JSON.parse(text) as T
}

async function waitForServerReady(
  process: McpServerProcess,
  maxMs = MATRIX_MCP_TIMEOUT_MS,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    let output = ''

    const onData = (chunk: Buffer) => {
      output += chunk.toString('utf8')
      const readyMatch = output.match(/\[ref mcp\] ready\s+(\S+)/)

      if (readyMatch) {
        cleanup()
        resolve(readyMatch[1])
      }
    }

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup()
      reject(new Error(`MCP server exited before becoming ready (code=${code}, signal=${signal})\n${output}`))
    }

    const interval = setInterval(() => {
      if (Date.now() - startedAt < maxMs) {
        return
      }

      cleanup()
      reject(new Error(`Timed out waiting for MCP server readiness\n${output}`))
    }, 100)

    const cleanup = () => {
      clearInterval(interval)
      process.stdout.off('data', onData)
      process.stderr.off('data', onData)
      process.off('exit', onExit)
    }

    process.stdout.on('data', onData)
    process.stderr.on('data', onData)
    process.once('exit', onExit)
  })
}

async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (typeof address !== 'object' || address === null) {
        server.close(() => reject(new Error('Unable to allocate a TCP port for MCP tests.')))
        return
      }

      const port = address.port
      server.close(error => {
        if (error) {
          reject(error)
          return
        }
        resolve(port)
      })
    })
  })
}

export async function startMcpClient(
  cwd: string,
  port = 0,
): Promise<RunningMcpClient> {
  const registry = process.env.npm_config_registry

  if (!registry) {
    throw new Error('npm_config_registry must be set so npx resolves @reference-ui/core from the staged matrix registry.')
  }

  const resolvedPort = port === 0 ? await getAvailablePort() : port
  const childProcess = spawn(
    MATRIX_MCP_NPX_COMMAND[0],
    [...MATRIX_MCP_NPX_COMMAND.slice(1), '--transport', 'http', '--port', String(resolvedPort)],
    {
      cwd,
      env: {
        ...process.env,
        npm_config_registry: registry,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  const readyUrl = await waitForServerReady(childProcess)
  const serverUrl = new URL(readyUrl)

  const transport = new StreamableHTTPClientTransport(serverUrl)
  const client = new Client(
    { name: 'matrix-mcp-test', version: '0.0.0' },
    { capabilities: {} },
  )
  await client.connect(transport, { timeout: MATRIX_MCP_TIMEOUT_MS })

  return {
    client,
    process: childProcess,
    serverUrl,
    transport,
  }
}

export async function stopMcpClient(running: RunningMcpClient | null | undefined): Promise<void> {
  if (!running) {
    return
  }

  await Promise.allSettled([running.client.close(), running.transport.close()])

  if (running.process.exitCode !== null || running.process.signalCode !== null) {
    return
  }

  await new Promise<void>(resolve => {
    const timeout = setTimeout(() => {
      if (running.process.exitCode === null && running.process.signalCode === null) {
        running.process.kill('SIGKILL')
      }
    }, 500)

    running.process.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })

    running.process.kill('SIGTERM')
  })
}

export async function startMatrixMcp(
  cwd = process.cwd(),
  port = 0,
): Promise<RunningMcpClient> {
  await buildMcpArtifactCache(cwd)
  return startMcpClient(cwd, port)
}
