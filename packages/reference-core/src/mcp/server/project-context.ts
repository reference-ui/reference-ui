import type { McpBuildArtifact } from '../pipeline/types'
import { toErrorResult, toTextResult } from './formatters'
import type { ProjectManager } from './project-manager'

export type ProjectHandler = (
  artifact: McpBuildArtifact,
  projectPath: string
) => Promise<Record<string, unknown>> | Record<string, unknown>

export type FallbackUniversalHandler = () => Record<string, unknown>

/**
 * Orchestrates project resolution, model artifact warmup/waiting, and execution for MCP tools.
 * Falls back to universal primitives mode when no project is active or resolved.
 */
export async function executeWithProject(
  projectManager: ProjectManager,
  requestedProject: string | undefined,
  handler: ProjectHandler,
  fallbackUniversal: FallbackUniversalHandler
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
