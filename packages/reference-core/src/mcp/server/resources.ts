import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { McpPublicModel } from '../pipeline/types'
import { toPublicModel } from './formatters'
import type { ProjectManager } from './project-manager'
import { getUniversalComponents } from './universal-primitives'

export const REFERENCE_MCP_INSTRUCTIONS_URI = 'reference-ui://instructions'
export const REFERENCE_MCP_GETTING_STARTED_URI = 'reference-ui://getting-started'
export const REFERENCE_MCP_COMPONENT_MODEL_URI = 'reference-ui://component-model'

export function registerReferenceResources(
  server: McpServer,
  projectManager: ProjectManager,
  instructions: string
): void {
  server.registerResource(
    'component-model',
    REFERENCE_MCP_COMPONENT_MODEL_URI,
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
}
