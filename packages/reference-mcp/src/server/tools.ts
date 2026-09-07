import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  compactComponent,
  findComponent,
  getComponentProps,
  listComponents,
  listTokens,
} from '../pipeline/queries'
import { findReferenceUiLibraryComponent } from '../pipeline/library-catalog'
import type { McpBuildArtifact } from '../pipeline/types'
import { getStylePropsReference } from '../pipeline/style-props'
import { toErrorResult, toTextResult } from './formatters'
import { executeWithProject } from './project-context'
import type { ProjectManager } from './project-manager'
import {
  getUniversalComponent,
  getUniversalComponentExamples,
  getUniversalComponentProps,
  getUniversalComponents,
  getUniversalTokens,
} from './universal-primitives'
import { searchIcons } from '../pipeline/icons-catalog'

export function registerReferenceTools(
  server: McpServer,
  projectManager: ProjectManager
): void {
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
      executeWithProject(
        projectManager,
        input.project,
        artifact => ({ components: listComponents(artifact, input) }),
        () => getUniversalComponents(input)
      )
  )

function checkReferenceLibraryDisabled(
  artifact: McpBuildArtifact,
  name: string,
  source?: string
): { error: string } | null {
  if (artifact.useReferenceLibrary !== false) return null

  if (source === '@reference-ui/lib') {
    return {
      error: `Component '${name}' is part of @reference-ui/lib, but 'use_reference_library' is disabled in ui.config.`,
    }
  }

  if (!source) {
    const localMatches = artifact.components.filter(
      c => c.name.toLowerCase() === name.toLowerCase() && c.source !== '@reference-ui/lib'
    )
    if (localMatches.length === 0 && findReferenceUiLibraryComponent(name)) {
      return {
        error: `Component '${name}' is part of @reference-ui/lib, but 'use_reference_library' is disabled in ui.config.`,
      }
    }
  }

  return null
}

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
      executeWithProject(
        projectManager,
        input.project,
        artifact => {
          const disabledError = checkReferenceLibraryDisabled(artifact, input.name, input.source)
          if (disabledError) return disabledError

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
      executeWithProject(
        projectManager,
        input.project,
        artifact => {
          const disabledError = checkReferenceLibraryDisabled(artifact, input.name, input.source)
          if (disabledError) return disabledError

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
      executeWithProject(
        projectManager,
        input.project,
        artifact => {
          const disabledError = checkReferenceLibraryDisabled(artifact, input.name, input.source)
          if (disabledError) return disabledError

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
      executeWithProject(
        projectManager,
        input.project,
        artifact => ({ ...listTokens(artifact, input) }),
        () => getUniversalTokens()
      )
  )

  server.registerTool(
    'list_icons',
    {
      title: 'List Icons',
      description:
        'Search and discover icons available in @reference-ui/icons (Material Symbols React components).',
      inputSchema: {
        project: z
          .string()
          .optional()
          .describe('Optional relative or absolute filesystem path to target project directory.'),
        query: z
          .string()
          .optional()
          .describe('Search term for icon name, tag, or semantic keyword (e.g. "search", "trash", "gear", "pencil", "arrow").'),
        category: z
          .string()
          .optional()
          .describe('Optional category filter (e.g. "action", "navigation", "editor", "content", "device").'),
        limit: z.number().int().positive().max(100).optional().describe('Maximum number of icons to return (default: 25).'),
      },
    },
    async input =>
      executeWithProject(
        projectManager,
        input.project,
        artifact => {
          if (artifact.useReferenceIcons === false) {
            return {
              enabled: false,
              notice:
                "Reference Icons are disabled in ui.config (use_reference_icons: false). Use the project's custom icon system.",
              total: 0,
              returned: 0,
              icons: [],
            }
          }
          return searchIcons(input)
        },
        () => searchIcons(input)
      )
  )
}
