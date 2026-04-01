import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  execFileSync,
  spawn,
  type ChildProcessByStdio,
} from 'node:child_process'
import { existsSync } from 'node:fs'
import type { Readable } from 'node:stream'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type McpServerProcess = ChildProcessByStdio<null, Readable, Readable>

export interface RunningMcpClient {
  client: Client
  transport: StreamableHTTPClientTransport
  process: McpServerProcess
  serverUrl: URL
}

interface TextContentEntry {
  type: 'text'
  text: string
}

interface ResourceTextEntry {
  uri: string
  text: string
  mimeType?: string
}

const __dirname = dirname(fileURLToPath(import.meta.url))

export const referenceUnitRoot = resolve(__dirname, '..', '..')
export const refCoreCliPath = join(
  referenceUnitRoot,
  'node_modules',
  '@reference-ui',
  'core',
  'dist',
  'cli',
  'index.mjs'
)

export function ensureRefCoreCli(): void {
  if (!existsSync(refCoreCliPath)) {
    throw new Error(
      'reference-core CLI build must exist before MCP integration tests run'
    )
  }
}

export function runRefSync(cwd: string): void {
  ensureRefCoreCli()
  execFileSync('node', [refCoreCliPath, 'sync'], {
    cwd,
    stdio: 'pipe',
  })
}

export async function waitForServerReady(
  process: McpServerProcess,
  maxMs = 20_000
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
      reject(
        new Error(
          `MCP server exited before becoming ready (code=${code}, signal=${signal})\n${output}`
        )
      )
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

export async function startMcpClient(
  cwd: string,
  port: number
): Promise<RunningMcpClient> {
  ensureRefCoreCli()

  const process = spawn('node', [refCoreCliPath, 'mcp', '--port', String(port)], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const serverUrl = new URL(`http://127.0.0.1:${port}/mcp`)
  const readyUrl = await waitForServerReady(process)

  if (readyUrl !== serverUrl.href) {
    throw new Error(`Unexpected MCP ready URL: ${readyUrl}`)
  }

  const transport = new StreamableHTTPClientTransport(serverUrl)
  const client = new Client(
    { name: 'reference-unit-mcp-test', version: '0.0.0' },
    { capabilities: {} }
  )
  await client.connect(transport)

  return {
    client,
    transport,
    process,
    serverUrl,
  }
}

export async function stopMcpClient(
  running: RunningMcpClient | null | undefined
): Promise<void> {
  if (!running) {
    return
  }

  void running.transport.close().catch(() => {})

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

export function findTextContent(result: unknown): string {
  const content = (result as { content?: unknown })?.content
  if (!Array.isArray(content)) {
    return ''
  }

  const match = content.find(
    (entry): entry is TextContentEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      (entry as { type?: unknown }).type === 'text' &&
      typeof (entry as { text?: unknown }).text === 'string'
  )

  return match?.text ?? ''
}

export function parseTextJson<T>(result: unknown): T | null {
  const text = findTextContent(result)
  if (!text) {
    return null
  }

  return JSON.parse(text) as T
}

export function findTextResource(result: unknown): ResourceTextEntry | null {
  const contents = (result as { contents?: unknown })?.contents
  if (!Array.isArray(contents)) {
    return null
  }

  return (
    contents.find(
      (entry): entry is ResourceTextEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { uri?: unknown }).uri === 'string' &&
        typeof (entry as { text?: unknown }).text === 'string'
    ) ?? null
  )
}
