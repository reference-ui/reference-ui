import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { existsSync } from 'node:fs'
import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from 'node:http'
import { resolve } from 'node:path'
import { z } from 'zod'
import { log } from '../../lib/log'
import { readMcpArtifact } from '../pipeline/artifact'
import { getMcpModelPath } from '../pipeline/paths'
import {
  compactComponent,
  findComponent,
  getCommonPatterns,
  getComponentProps,
  listComponents,
  listTokens,
} from '../pipeline/queries'
import { getStylePropsReference } from '../pipeline/style-props'
import type { McpBuildArtifact, McpPublicModel } from '../pipeline/types'
import { spawnMcpBuildChild } from '../worker/child-process/process'

export interface CreateReferenceMcpServerOptions {
  cwd: string
  modelState: McpModelState
}

export interface RunReferenceMcpHttpServerOptions {
  cwd: string
  port?: number
  host?: string
}

export const DEFAULT_REFERENCE_MCP_PORT = 3697
export const DEFAULT_REFERENCE_MCP_HOST = '127.0.0.1'
export const DEFAULT_REFERENCE_MCP_PATH = '/mcp'
export const REFERENCE_MCP_READY_PREFIX = '[ref mcp] ready'
export const REFERENCE_MCP_GETTING_STARTED_URI = 'reference-ui://getting-started'

const REFERENCE_UI_MCP_INSTRUCTIONS = [
  'Reference UI MCP is a project-aware component, prop, style, and token reference.',
  'Start with list_components to discover available components and observed prop usage.',
  'Use get_component for a compact guide to one component. It intentionally omits large inherited StyleProps surfaces.',
  'Use get_component_props only when you need the exhaustive prop/interface readout for one component.',
  'Use get_style_props for the shared StyleProps/token category guide, and get_tokens for project token paths and descriptions.',
].join('\n')

const REFERENCE_UI_GETTING_STARTED = `# Reference UI MCP

Reference UI MCP helps assistants answer: what components are available in this project, and what can be passed to them?

Recommended flow:

1. Call \`list_components\` to find components and see observed prop usage.
2. Call \`get_component\` for a compact component guide with examples and common props.
3. Call \`get_component_props\` only when exhaustive prop details are needed.
4. Call \`get_style_props\` for the shared StyleProps model instead of asking each component to repeat CSS props.
5. Call \`get_tokens\` to inspect project token names, categories, values, and descriptions.

Style-bearing components may accept Reference UI StyleProps. Those props are Panda-style CSS props with token-aware values; color-bearing props are narrowed to project color tokens plus safe CSS keywords.
`

export interface McpModelState {
  /** Load cached artifact if present, else build; may start a background refresh when cache exists. */
  warmStart(): Promise<void>
  /** Current best artifact (updates when a background refresh completes). */
  load(): Promise<McpBuildArtifact>
}

/**
 * When `model.json` already exists, it is read immediately so tools stay responsive; a full
 * rebuild runs once in the background and replaces the in-memory artifact when done. When no
 * cache exists, the first build runs before the server accepts traffic.
 */
export function createMcpModelState(options: { cwd: string }): McpModelState {
  const cwd = resolve(options.cwd)
  let artifact: McpBuildArtifact | null = null
  let bgRunning = false

  async function buildArtifactInChild(): Promise<McpBuildArtifact> {
    await spawnMcpBuildChild(cwd)
    return readMcpArtifact(cwd)
  }

  function scheduleBackgroundRefresh(): void {
    if (bgRunning) return
    bgRunning = true
    buildArtifactInChild()
      .then(next => {
        artifact = next
      })
      .catch(error => {
        log.warn('[mcp] Background model refresh failed:', error)
      })
      .finally(() => {
        bgRunning = false
      })
  }

  return {
    async warmStart(): Promise<void> {
      const modelPath = getMcpModelPath(cwd)
      if (existsSync(modelPath)) {
        artifact = await readMcpArtifact(cwd)
        scheduleBackgroundRefresh()
      } else {
        artifact = await buildArtifactInChild()
      }
    },

    async load(): Promise<McpBuildArtifact> {
      if (!artifact) {
        throw new Error('[mcp] Model is not ready')
      }
      return artifact
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
    components: listComponents(artifact, { limit: artifact.components.length }),
  }
}

export function createReferenceMcpServer(
  options: CreateReferenceMcpServerOptions
): McpServer {
  const state = options.modelState
  const server = new McpServer({
    name: 'reference-ui',
    title: 'Reference UI',
    version: '0.0.3',
    description:
      'Atlas- and generated-types-backed component inspection for Reference UI projects.',
  }, {
    instructions: REFERENCE_UI_MCP_INSTRUCTIONS,
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
      return toTextResult({ ...compactComponent(component) })
    }
  )

  server.registerTool(
    'get_component_props',
    {
      title: 'Get Component Props',
      description:
        'Return the full prop/interface readout for a component, with optional filters for style props and unused documented props.',
      inputSchema: {
        name: z.string(),
        source: z.string().optional(),
        includeUnused: z.boolean().optional(),
        includeStyleProps: z.boolean().optional(),
        query: z.string().optional(),
        limit: z.number().int().positive().max(500).optional(),
      },
    },
    async input => {
      const artifact = await state.load()
      const result = getComponentProps(artifact, input)
      if (!result) {
        return toErrorResult(`Component not found: ${input.name}`)
      }

      return toTextResult({
        name: result.component.name,
        source: result.component.source,
        interface: result.component.interface,
        props: result.props,
        propSummary: result.propSummary,
        styleProps: compactComponent(result.component).styleProps,
      })
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

  server.registerTool(
    'get_style_props',
    {
      title: 'Get Style Props',
      description:
        'Return the shared Reference UI StyleProps guide and token category compatibility.',
      inputSchema: {
        query: z.string().optional(),
        includeProps: z.boolean().optional(),
      },
    },
    async input => {
      return toTextResult(getStylePropsReference(input))
    }
  )

  server.registerTool(
    'get_tokens',
    {
      title: 'Get Tokens',
      description:
        'Return project token paths, categories, values, and descriptions collected from Reference UI token fragments.',
      inputSchema: {
        category: z.string().optional(),
        query: z.string().optional(),
        limit: z.number().int().positive().max(1000).optional(),
      },
    },
    async input => {
      const artifact = await state.load()
      return toTextResult({
        tokens: listTokens(artifact, input),
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

  server.registerResource(
    'getting-started',
    REFERENCE_MCP_GETTING_STARTED_URI,
    {
      title: 'Reference UI MCP Getting Started',
      description: 'Short guide for using Reference UI MCP tools efficiently.',
      mimeType: 'text/markdown',
    },
    async uri => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: REFERENCE_UI_GETTING_STARTED,
        },
      ],
    })
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
  options: CreateReferenceMcpServerOptions
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

export async function runReferenceMcpServer(options: { cwd: string }): Promise<void> {
  const modelState = createMcpModelState({ cwd: options.cwd })
  await modelState.warmStart()
  const server = createReferenceMcpServer({
    cwd: options.cwd,
    modelState,
  })
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export async function runReferenceMcpHttpServer(
  options: RunReferenceMcpHttpServerOptions
): Promise<void> {
  const modelState = createMcpModelState({ cwd: options.cwd })
  await modelState.warmStart()

  const host = options.host ?? DEFAULT_REFERENCE_MCP_HOST
  const port = options.port ?? DEFAULT_REFERENCE_MCP_PORT
  const server = createReferenceMcpHttpServer({
    cwd: options.cwd,
    modelState,
  })

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
