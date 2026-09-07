import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { readFileSync } from 'node:fs'
import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from 'node:http'
import { resolve } from 'node:path'
import { z } from 'zod'
import { log } from '../../lib/log'
import { resolveCorePackageDir } from '../../lib/paths/core-package-dir'
import {
  compactComponent,
  findComponent,
  getComponentProps,
  listComponents,
  listTokens,
} from '../pipeline/queries'
import { getStylePropsReference } from '../pipeline/style-props'
import type { McpBuildArtifact, McpPublicModel } from '../pipeline/types'
import {
  createMcpModelState,
  type McpModelState,
  type ProjectError,
} from './model-state'
import { ProjectManager } from './project-manager'
import {
  getUniversalComponent,
  getUniversalComponentExamples,
  getUniversalComponentProps,
  getUniversalComponents,
  getUniversalTokens,
} from './universal-primitives'

export { createMcpModelState, type McpModelState, type ProjectError }
export { ProjectManager }

export interface CreateReferenceMcpServerOptions {
  cwd: string
  projectManager?: ProjectManager
  modelState?: McpModelState
}

export interface RunReferenceMcpHttpServerOptions {
  cwd: string
  port?: number
  host?: string
  project?: string
}

export const DEFAULT_REFERENCE_MCP_PORT = 3697
export const DEFAULT_REFERENCE_MCP_HOST = '127.0.0.1'
export const DEFAULT_REFERENCE_MCP_PATH = '/mcp'
export const REFERENCE_MCP_READY_PREFIX = '[ref mcp] ready'
export const REFERENCE_MCP_INSTRUCTIONS_URI = 'reference-ui://instructions'
export const REFERENCE_MCP_GETTING_STARTED_URI = 'reference-ui://getting-started'

const REFERENCE_UI_INSTRUCTIONS_FALLBACK = `# Reference UI Agent Instructions & Guiding Principles

Reference UI is a knowledge-first component and design-system engine for React, featuring generated primitives, token-aware atomic styling, rhythm units, and container-query-first responsive design.

1. Primitives First: Import from @reference-ui/react (<Div>, <Section>, <Main>, <P>, <Button>).
2. StyleProps: Use camelCased atomic StyleProps; no Tailwind or arbitrary CSS classes.
3. Rhythm Spacing: Use strings ending in 'r' (e.g. '1r', '2r', '4r').
4. Container Queries: Use container and r={{ 320: { ... }, 640: { ... } }}. No viewport media queries.
5. Workspace Intelligence: Call list_projects, select_project, or pass project parameter to target packages.
`

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
    components: listComponents(artifact, { limit: 500 }),
  }
}

function loadReferenceMcpInstructions(cwd: string): string {
  try {
    const coreDir = resolveCorePackageDir(cwd)
    return readFileSync(resolve(coreDir, 'src', 'mcp', 'instructions.md'), 'utf8')
  } catch (error) {
    log.warn('[mcp] Failed to load instructions.md; using fallback instructions.', error)
    return REFERENCE_UI_INSTRUCTIONS_FALLBACK
  }
}

export function createReferenceMcpServer(
  options: CreateReferenceMcpServerOptions
): McpServer {
  const projectManager = options.projectManager ?? new ProjectManager(options.cwd)
  const instructions = loadReferenceMcpInstructions(options.cwd)

  const server = new McpServer(
    {
      name: 'reference-ui',
      title: 'Reference UI',
      version: '0.0.3',
      description:
        'Atlas- and generated-types-backed component intelligence for Reference UI projects.',
    },
    {
      instructions,
    }
  )

  async function withProject(
    requestedProject: string | undefined,
    handler: (
      artifact: McpBuildArtifact,
      projectPath: string
    ) => Promise<Record<string, unknown>> | Record<string, unknown>,
    fallbackUniversal: () => Record<string, unknown>
  ) {
    await projectManager.waitForDiscovery()
    const projectPath = projectManager.resolveProject(requestedProject)

    const activeProject = projectManager.getActiveProject()
    const discovered = projectManager.getDiscoveredProjects()
    const availableProjects = discovered.map(p => p.path)
    let notice: string | undefined

    if (!projectPath) {
      const fallback = fallbackUniversal()
      if ('error' in fallback && typeof fallback.error === 'string') {
        return toErrorResult(fallback.error)
      }
      return toTextResult({
        activeProject,
        availableProjects,
        ...fallback,
      })
    }

    if (discovered.length > 1 && !requestedProject) {
      notice = `Operating in active project '${projectPath}'. To switch projects, call select_project({ path: '...' }) or pass 'project' in your tool call.`
    }

    const state = projectManager.getOrCreateState(projectPath)
    const artifact = await state.waitForReady(30_000)

    if (!artifact) {
      if (state.error) {
        if (state.error.code === 'missing_artifacts') {
          return toErrorResult(
            `Project at '${projectPath}' has not been synced yet.\n` +
              `Generated type artifacts are missing at '${projectPath}/.reference-ui/types/tasty/manifest.js'.\n` +
              `Run 'ref sync' (or 'pnpm dev') to generate the model artifacts.`
          )
        }
        return toErrorResult(state.error.message)
      }
      return toErrorResult('Project is still loading. Please retry in a few seconds.')
    }

    const res = await handler(artifact, projectPath)
    if ('error' in res && typeof res.error === 'string') {
      return toErrorResult(res.error)
    }

    return toTextResult({
      activeProject,
      availableProjects,
      ...(notice ? { notice } : {}),
      ...res,
    })
  }

  server.registerTool(
    'list_projects',
    {
      title: 'List Projects',
      description:
        'Discover and list all Reference UI project paths across the workspace, global registry, and optional search path. Automatically self-heals stale registry entries.',
      inputSchema: {
        scanPath: z
          .string()
          .optional()
          .describe(
            "Optional directory to scan for Reference UI projects (e.g. '~/Developer'). Defaults to workspace and global registry."
          ),
        maxDepth: z
          .number()
          .int()
          .min(1)
          .max(5)
          .default(3)
          .optional()
          .describe('Max directory traversal depth when scanPath is provided.'),
      },
    },
    async input => {
      await projectManager.waitForDiscovery()
      const result = projectManager.listProjects({
        scanPath: input.scanPath,
        maxDepth: input.maxDepth,
      })
      return toTextResult(result)
    }
  )

  server.registerTool(
    'select_project',
    {
      title: 'Select Project',
      description:
        'Set the active project path for the session and initiate background warmup of its Atlas AST and model artifacts.',
      inputSchema: {
        path: z
          .string()
          .describe(
            'Relative or absolute filesystem path to the project directory where ui.config.* resides.'
          ),
      },
    },
    async input => {
      await projectManager.waitForDiscovery()
      const result = projectManager.selectProject(input.path)
      if ('error' in result) {
        return toErrorResult(result.error)
      }
      const state = projectManager.getOrCreateState(result.project)
      const artifact = await state.waitForReady(30_000)
      return toTextResult({
        status: 'active',
        project: result.project,
        configPath: result.configPath,
        atlasStatus: artifact ? 'ready' : 'loading',
        componentsCount: artifact ? artifact.components.length : 0,
      })
    }
  )

  server.registerTool(
    'list_components',
    {
      title: 'List Components',
      description:
        'List components observed in the current project graph, including imported Reference UI primitives that are actually used in JSX.',
      inputSchema: {
        project: z
          .string()
          .optional()
          .describe('Optional relative or absolute filesystem path to target project directory.'),
        query: z.string().optional(),
        source: z.string().optional(),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async input =>
      withProject(
        input.project,
        artifact => ({ components: listComponents(artifact, input) }),
        () => getUniversalComponents(input)
      )
  )

  server.registerTool(
    'get_component',
    {
      title: 'Get Component',
      description:
        'Return the enriched model for one observed component or imported primitive used in this project.',
      inputSchema: {
        name: z.string(),
        source: z.string().optional(),
        project: z
          .string()
          .optional()
          .describe('Optional relative or absolute filesystem path to target project directory.'),
      },
    },
    async input =>
      withProject(
        input.project,
        artifact => {
          const component = findComponent(artifact, input)
          if (!component) {
            return { error: `Component not found: ${input.name}` }
          }
          return { ...compactComponent(component) }
        },
        () => getUniversalComponent(input.name)
      )
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
        project: z
          .string()
          .optional()
          .describe('Optional relative or absolute filesystem path to target project directory.'),
      },
    },
    async input =>
      withProject(
        input.project,
        artifact => {
          const result = getComponentProps(artifact, input)
          if (!result) {
            return { error: `Component not found: ${input.name}` }
          }
          const compact = compactComponent(result.component)

          return {
            name: result.component.name,
            kind: result.component.kind ?? 'project',
            source: result.component.source,
            count: result.component.count,
            usage: result.component.usage,
            usageSemantics: compact.usageSemantics,
            interface: result.component.interface,
            props: result.props,
            propSummary: result.propSummary,
            styleProps: compact.styleProps,
          }
        },
        () => getUniversalComponentProps(input.name)
      )
  )

  server.registerTool(
    'get_component_examples',
    {
      title: 'Get Component Examples',
      description: 'Return captured usage examples for a component.',
      inputSchema: {
        name: z.string(),
        source: z.string().optional(),
        project: z
          .string()
          .optional()
          .describe('Optional relative or absolute filesystem path to target project directory.'),
      },
    },
    async input =>
      withProject(
        input.project,
        artifact => {
          const component = findComponent(artifact, input)
          if (!component) {
            return { error: `Component not found: ${input.name}` }
          }

          return {
            name: component.name,
            kind: component.kind ?? 'project',
            source: component.source,
            examples: component.examples,
          }
        },
        () => getUniversalComponentExamples(input.name)
      )
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
    async input => toTextResult(getStylePropsReference(input))
  )

  server.registerTool(
    'get_tokens',
    {
      title: 'Get Tokens',
      description:
        'Return project token paths, categories, values, and descriptions collected from Reference UI token fragments. Large result sets are compressed; query a token path for details.',
      inputSchema: {
        category: z.string().optional(),
        query: z.string().optional(),
        limit: z.number().int().positive().max(1000).optional(),
        project: z
          .string()
          .optional()
          .describe('Optional relative or absolute filesystem path to target project directory.'),
      },
    },
    async input =>
      withProject(
        input.project,
        artifact => ({ ...listTokens(artifact, input) }),
        () => getUniversalTokens()
      )
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
      await projectManager.waitForDiscovery()
      const projectPath = projectManager.getActiveProject()
      let model: McpPublicModel
      if (projectPath) {
        const state = projectManager.getOrCreateState(projectPath)
        const artifact = await state.waitForReady(30_000)
        if (artifact) {
          model = toPublicModel(artifact)
        } else {
          model = {
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            components: getUniversalComponents().components,
          }
        }
      } else {
        model = {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          components: getUniversalComponents().components,
        }
      }
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
    'instructions',
    REFERENCE_MCP_INSTRUCTIONS_URI,
    {
      title: 'Reference UI MCP Instructions',
      description: 'Comprehensive guide and instructions for Reference UI.',
      mimeType: 'text/markdown',
    },
    async uri => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: instructions,
        },
      ],
    })
  )

  server.registerResource(
    'getting-started',
    REFERENCE_MCP_GETTING_STARTED_URI,
    {
      title: 'Reference UI MCP Getting Started (Legacy Alias)',
      description: 'Legacy alias for reference-ui://instructions.',
      mimeType: 'text/markdown',
    },
    async uri => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: instructions,
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

export async function runReferenceMcpServer(options: {
  cwd: string
  project?: string
}): Promise<void> {
  const projectManager = new ProjectManager(options.cwd, { project: options.project })
  const server = createReferenceMcpServer({
    cwd: options.cwd,
    projectManager,
  })
  const transport = new StdioServerTransport()
  await server.connect(transport)

  // Resilient non-blocking boot: initialize in background after handshake completes
  projectManager.initialize().catch(err => {
    log.warn('[mcp] Background project discovery warning:', err)
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
