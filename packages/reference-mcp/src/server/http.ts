import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from 'node:http'
import { log } from './logger'
import { ProjectManager } from './project-manager'
import {
  createReferenceMcpServer,
  type CreateReferenceMcpServerOptions,
} from './server-factory'

export const DEFAULT_REFERENCE_MCP_PORT = 3697
export const DEFAULT_REFERENCE_MCP_HOST = '127.0.0.1'
export const DEFAULT_REFERENCE_MCP_PATH = '/mcp'
export const REFERENCE_MCP_READY_PREFIX = '[ref mcp] ready'

export interface RunReferenceMcpHttpServerOptions {
  cwd: string
  port?: number
  host?: string
  project?: string
}

function matchesMcpPath(req: IncomingMessage): boolean {
  const url = new URL(
    req.url ?? '/',
    `http://${req.headers.host ?? DEFAULT_REFERENCE_MCP_HOST}`
  )
  return url.pathname === DEFAULT_REFERENCE_MCP_PATH
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  if (chunks.length === 0) {
    return undefined
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function writeJsonResponse(
  res: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>
): void {
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(payload))
}

async function closeHttpRequestSession(
  transport: StreamableHTTPServerTransport,
  server: McpServer
): Promise<void> {
  await Promise.allSettled([transport.close(), server.close()])
}

function handleUnsupportedMcpMethod(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method === 'GET' || req.method === 'DELETE' || req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('allow', 'POST')
    res.end('Method Not Allowed')
    return true
  }

  return false
}

async function readMcpRequestBody(
  req: IncomingMessage,
  res: ServerResponse
): Promise<unknown | null> {
  try {
    return await readJsonBody(req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON body'
    writeJsonResponse(res, 400, {
      jsonrpc: '2.0',
      error: { code: -32700, message },
      id: null,
    })
    return null
  }
}

export function createReferenceMcpHttpServer(
  options: CreateReferenceMcpServerOptions
): HttpServer {
  const projectManager = options.projectManager ?? new ProjectManager(options.cwd)

  return createServer(async (req, res) => {
    if (!matchesMcpPath(req)) {
      writeJsonResponse(res, 404, {
        jsonrpc: '2.0',
        error: { code: -32004, message: 'Not Found' },
        id: null,
      })
      return
    }

    if (handleUnsupportedMcpMethod(req, res)) {
      return
    }

    const parsedBody = await readMcpRequestBody(req, res)
    if (parsedBody == null) {
      return
    }

    const server = createReferenceMcpServer({
      cwd: options.cwd,
      projectManager,
    })
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    })

    const cleanup = () => {
      void closeHttpRequestSession(transport, server)
    }

    res.once('close', cleanup)

    try {
      await server.connect(transport)
      await transport.handleRequest(req, res, parsedBody)
    } catch (error) {
      cleanup()
      log.error('[mcp] HTTP request failed:', error)
      if (!res.headersSent) {
        writeJsonResponse(res, 500, {
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        })
      }
    }
  })
}

export async function runReferenceMcpHttpServer(
  options: RunReferenceMcpHttpServerOptions
): Promise<void> {
  const projectManager = new ProjectManager(options.cwd, { project: options.project })
  const host = options.host ?? DEFAULT_REFERENCE_MCP_HOST
  const port = options.port ?? DEFAULT_REFERENCE_MCP_PORT
  const server = createReferenceMcpHttpServer({
    cwd: options.cwd,
    projectManager,
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolve())
  })

  // Resilient non-blocking boot
  projectManager.initialize().catch(err => {
    log.warn('[mcp] Background project discovery warning:', err)
  })

  process.stdout.write(
    `${REFERENCE_MCP_READY_PREFIX} http://${host}:${port}${DEFAULT_REFERENCE_MCP_PATH}\n`
  )

  const closeServer = () => {
    if (!server.listening) return
    server.close()
  }

  process.once('SIGINT', closeServer)
  process.once('SIGTERM', closeServer)

  await new Promise<void>((resolve, reject) => {
    server.once('close', resolve)
    server.once('error', reject)
  })
}
