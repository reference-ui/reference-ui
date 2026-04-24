import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Readable } from 'node:stream'

type McpServerProcess = ChildProcessByStdio<null, Readable, Readable>

interface RunningMcpClient {
  client: Client
  process: McpServerProcess
  serverUrl: URL
  transport: StreamableHTTPClientTransport
}

interface TextContentEntry {
  type: 'text'
  text: string
}

interface ResourceTextEntry {
  mimeType?: string
  text: string
  uri: string
}

interface ComponentSummary {
  name: string
}

interface ComponentModel {
  components: ComponentSummary[]
  generatedAt: string
  schemaVersion: number
}

const MATRIX_MCP_PORT = 3797
const MATRIX_MCP_TIMEOUT_MS = 120_000

function resolveInstalledMcpChildPath(cwd: string): string {
  return join(cwd, 'node_modules', '@reference-ui', 'core', 'dist', 'cli', 'mcp-child.mjs')
}

async function buildMcpArtifactCache(cwd: string): Promise<void> {
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

    child.once('error', (error) => {
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

function findTextContent(result: unknown): string {
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

function findTextResource(result: unknown): ResourceTextEntry | null {
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

function parseTextJson<T>(result: unknown): T {
  const text = findTextContent(result)

  if (!text) {
    throw new Error('Expected MCP response to include a text payload.')
  }

  return JSON.parse(text) as T
}

async function waitForServerReady(process: McpServerProcess, maxMs = MATRIX_MCP_TIMEOUT_MS): Promise<string> {
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

async function startMcpClient(cwd: string, port: number): Promise<RunningMcpClient> {
  const registry = process.env.npm_config_registry

  if (!registry) {
    throw new Error('npm_config_registry must be set so npx resolves @reference-ui/core from the staged matrix registry.')
  }

  const childProcess = spawn(
    'npx',
    ['--yes', '--package=@reference-ui/core@latest', 'mcp', '--transport', 'http', '--port', String(port)],
    {
      cwd,
      env: {
        ...process.env,
        npm_config_registry: registry,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  const serverUrl = new URL(`http://127.0.0.1:${port}/mcp`)
  const readyUrl = await waitForServerReady(childProcess)

  if (readyUrl !== serverUrl.href) {
    throw new Error(`Unexpected MCP ready URL: ${readyUrl}`)
  }

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

async function stopMcpClient(running: RunningMcpClient | null | undefined): Promise<void> {
  if (!running) {
    return
  }

  await Promise.allSettled([running.client.close(), running.transport.close()])

  if (running.process.exitCode !== null || running.process.signalCode !== null) {
    return
  }

  await new Promise<void>((resolve) => {
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

let running: RunningMcpClient | null = null

describe('matrix MCP package', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    await buildMcpArtifactCache(process.cwd())
    running = await startMcpClient(process.cwd(), MATRIX_MCP_PORT)
    expect(running.serverUrl.href).toBe(`http://127.0.0.1:${MATRIX_MCP_PORT}/mcp`)
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('serves the published MCP server through npx and exposes the fixture components', async () => {
    expect(process.env.npm_config_registry).toBeTruthy()
    expect(running).not.toBeNull()

    const tools = await running!.client.listTools()
    const toolNames = tools.tools.map(tool => tool.name).sort()

    expect(toolNames).toEqual([
      'get_common_patterns',
      'get_component',
      'get_component_examples',
      'list_components',
    ])

    const resource = await running!.client.readResource({
      uri: 'reference-ui://component-model',
    })
    const modelJson = findTextResource(resource)
    const model = modelJson ? (JSON.parse(modelJson.text) as ComponentModel) : null

    expect(modelJson).not.toBeNull()
    expect(modelJson?.mimeType).toBe('application/json')
    expect(model?.schemaVersion).toBe(1)
    expect(Array.isArray(model?.components)).toBe(true)
    expect(typeof model?.generatedAt).toBe('string')
    expect(modelJson?.text).not.toContain('workspaceRoot')
    expect(modelJson?.text).not.toContain('manifestPath')
    expect(modelJson?.text).not.toContain('diagnostics')

    const listComponentsResult = await running!.client.callTool({
      name: 'list_components',
      arguments: {
        query: 'hero',
      },
    })
    const listed = parseTextJson<{ components: ComponentSummary[] }>(listComponentsResult)

    expect(Array.isArray(listed.components)).toBe(true)
  })
})