import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from 'node:http'
import { z } from 'zod'
import { log } from '../../lib/log'
import { loadOrBuildMcpArtifact } from '../pipeline/build'
import { findComponent, getCommonPatterns, listComponents } from '../pipeline/queries'
import type { McpBuildArtifact, McpPublicModel } from '../pipeline/types'

export interface CreateReferenceMcpServerOptions {
  cwd: string
  forceBuild?: boolean
}

export interface RunReferenceMcpHttpServerOptions extends CreateReferenceMcpServerOptions {
  port?: number
  host?: string
}

export const DEFAULT_REFERENCE_MCP_PORT = 3697
export const DEFAULT_REFERENCE_MCP_HOST = '127.0.0.1'
export const DEFAULT_REFERENCE_MCP_PATH = '/mcp'
export const REFERENCE_MCP_READY_PREFIX = '[ref mcp] ready'

interface McpModelState {
  load(force?: boolean): Promise<McpBuildArtifact>
}

function createModelState(options: CreateReferenceMcpServerOptions): McpModelState {
  let inFlight: Promise<McpBuildArtifact> | null = null

  return {
    async load(force = false): Promise<McpBuildArtifact> {
      if (!force && inFlight) return inFlight

      inFlight = loadOrBuildMcpArtifact({
        cwd: options.cwd,
        force: force || options.forceBuild,
      })

      try {
        return await inFlight
      } finally {
        inFlight = null
      }
    },
  }
}

function toTextResult<T extends Record<string, unknown>>(payload: T) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  }
}

function toErrorResult(message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true,
  }
}

function toPublicModel(artifact: McpBuildArtifact): McpPublicModel {
  return {
    schemaVersion: artifact.schemaVersion,
    generatedAt: artifact.generatedAt,
    components: artifact.components,
  }
}

export function createReferenceMcpServer(
  options: CreateReferenceMcpServerOptions
): McpServer {
  const state = createModelState(options)
  const server = new McpServer({
    name: 'reference-ui',
    title: 'Reference UI',
    version: '0.0.3',
    description:
      'Atlas- and generated-types-backed component inspection for Reference UI projects.',
  })

  server.registerTool(
    'list_components',
    {
      title: 'List Components',
      description:
        'List available components discovered in the current Reference UI project.',
      inputSchema: {
        query: z.string().optional(),
        source: z.string().optional(),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async input => {
      const artifact = await state.load()
      return toTextResult({ components: listComponents(artifact, input) })
    }
  )

  server.registerTool(
    'get_component',
    {
      title: 'Get Component',
      description: 'Return the enriched component model for a single component.',
      inputSchema: {
        name: z.string(),
        source: z.string().optional(),
      },
    },
    async input => {
      const artifact = await state.load()
      const component = findComponent(artifact, input)
      if (!component) {
        return toErrorResult(`Component not found: ${input.name}`)
      }
      return toTextResult({ ...component })
    }
  )

  server.registerTool(
    'get_component_examples',
    {
      title: 'Get Component Examples',
      description: 'Return captured usage examples for a component.',
      inputSchema: {
        name: z.string(),
        source: z.string().optional(),
      },
    },
    async input => {
      const artifact = await state.load()
      const component = findComponent(artifact, input)
      if (!component) {
        return toErrorResult(`Component not found: ${input.name}`)
      }

      return toTextResult({
        name: component.name,
        source: component.source,
        examples: component.examples,
      })
    }
  )

  server.registerTool(
    'get_common_patterns',
    {
      title: 'Get Common Patterns',
      description: 'Show which components commonly appear with the requested component.',
      inputSchema: {
        name: z.string(),
        source: z.string().optional(),
        limit: z.number().int().positive().max(50).optional(),
      },
    },
    async input => {
      const artifact = await state.load()
      const patterns = getCommonPatterns(artifact, input)
      if (!patterns) {
        return toErrorResult(`Component not found: ${input.name}`)
      }

      return toTextResult({
        name: input.name,
        source: input.source ?? null,
        patterns,
      })
    }
  )

  server.registerResource(
    'component-model',
    'reference-ui://component-model',
    {
      title: 'Reference UI Component Model',
      description: 'Current Atlas plus generated-types component model.',
      mimeType: 'application/json',
    },
    async uri => {
      const artifact = await state.load()
      const model = toPublicModel(artifact)
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(model, null, 2),
          },
        ],
      }
    }
  )

  return server
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
  if (req.method === 'GET' || req.method === 'DELETE') {
    res.statusCode = 405
    res.setHeader('allow', 'POST')
    res.end('Method Not Allowed')
    return true
  }

  if (req.method !== 'POST') {
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
  options: RunReferenceMcpHttpServerOptions
): HttpServer {
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

    const server = createReferenceMcpServer(options)
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

export async function runReferenceMcpServer(
  options: CreateReferenceMcpServerOptions
): Promise<void> {
  const server = createReferenceMcpServer(options)
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export async function runReferenceMcpHttpServer(
  options: RunReferenceMcpHttpServerOptions
): Promise<void> {
  const host = options.host ?? DEFAULT_REFERENCE_MCP_HOST
  const port = options.port ?? DEFAULT_REFERENCE_MCP_PORT
  const server = createReferenceMcpHttpServer(options)

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolve())
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
