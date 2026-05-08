/**
 * MCP server/client lifecycle helpers for matrix tests.
 *
 * Global setup starts the installed MCP CLI from the synthetic consumer
 * server once. Test files then connect independent clients to the shared HTTP
 * endpoint so Vitest file parallelism can stay enabled.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import { buildMcpArtifactCache } from './artifact'
import {
  MATRIX_MCP_INSTALLED_COMMAND,
  MATRIX_MCP_TIMEOUT_MS,
  type McpServerProcess,
  type RunningMcpClient,
  type RunningMcpServer,
} from './types'

function resolveInstalledMcpBinPath(cwd: string): string {
  return join(cwd, 'node_modules', '@reference-ui', 'core', 'bin', 'mcp.mjs')
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

export async function startMcpServer(
  cwd: string,
  port = 0,
): Promise<RunningMcpServer> {
  const registry = process.env.npm_config_registry

  if (!registry) {
    throw new Error('npm_config_registry must be set so the installed MCP CLI resolves staged registry dependencies correctly.')
  }

  const resolvedPort = port === 0 ? await getAvailablePort() : port
  const installedMcpBinPath = resolveInstalledMcpBinPath(cwd)
  const childProcess = spawn(
    process.execPath,
    [installedMcpBinPath, ...MATRIX_MCP_INSTALLED_COMMAND.slice(1), '--transport', 'http', '--port', String(resolvedPort)],
    {
      cwd,
      detached: true,
      env: {
        ...process.env,
        npm_config_registry: registry,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  const readyUrl = await waitForServerReady(childProcess)
  const serverUrl = new URL(readyUrl)
  const stdout = childProcess.stdout as Readable & { unref?: () => void }
  const stderr = childProcess.stderr as Readable & { unref?: () => void }

  childProcess.unref()
  stdout.unref?.()
  stderr.unref?.()

  return {
    process: childProcess,
    serverUrl,
  }
}

export async function startMcpClient(
  cwd: string,
  port = 0,
): Promise<RunningMcpClient> {
  const server = await startMcpServer(cwd, port)
  const connected = await connectMcpClient(server.serverUrl)

  return {
    ...connected,
    process: server.process,
  }
}

export async function connectMcpClient(serverUrl: URL): Promise<RunningMcpClient> {
  const transport = new StreamableHTTPClientTransport(serverUrl)
  const client = new Client(
    { name: 'matrix-mcp-test', version: '0.0.0' },
    { capabilities: {} },
  )
  await client.connect(transport, { timeout: MATRIX_MCP_TIMEOUT_MS })

  return {
    client,
    serverUrl,
    transport,
  }
}

function killMcpServerProcess(serverProcess: McpServerProcess, signal: NodeJS.Signals): void {
  if (serverProcess.pid && process.platform !== 'win32') {
    try {
      process.kill(-serverProcess.pid, signal)
      return
    } catch {
      // Fall back to the direct child; the process may have already left its group.
    }
  }

  serverProcess.kill(signal)
}

export async function stopMcpServer(running: RunningMcpServer | null | undefined): Promise<void> {
  if (!running || running.process.exitCode !== null || running.process.signalCode !== null) {
    return
  }

  await new Promise<void>(resolve => {
    const timeout = setTimeout(() => {
      if (running.process.exitCode === null && running.process.signalCode === null) {
        killMcpServerProcess(running.process, 'SIGKILL')
      }
    }, 500)

    running.process.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })

    killMcpServerProcess(running.process, 'SIGTERM')
  })
}

export async function stopMcpClient(running: RunningMcpClient | null | undefined): Promise<void> {
  if (!running) {
    return
  }

  const serverProcess = running.process

  if (serverProcess && serverProcess.exitCode === null && serverProcess.signalCode === null) {
    await stopMcpServer({ process: serverProcess, serverUrl: running.serverUrl })
  }

  await Promise.allSettled([running.client.close(), running.transport.close()])
}

export async function startMatrixMcp(
  cwd = process.cwd(),
  port = 0,
): Promise<RunningMcpClient> {
  await buildMcpArtifactCache(cwd)
  return startMcpClient(cwd, port)
}

export async function startMatrixMcpServer(
  cwd = process.cwd(),
  port = 0,
): Promise<RunningMcpServer> {
  await buildMcpArtifactCache(cwd)
  return startMcpServer(cwd, port)
}

export async function connectSharedMatrixMcp(): Promise<RunningMcpClient> {
  const serverUrl = process.env.MATRIX_MCP_SERVER_URL

  if (!serverUrl) {
    throw new Error('MATRIX_MCP_SERVER_URL must be set by the matrix MCP Vitest global setup.')
  }

  return connectMcpClient(new URL(serverUrl))
}
