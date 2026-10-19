// Runs tool handlers against the active project or the universal fallback.
// It takes the project manager plus a project handler and emits the handler result, the
// not-synced message, or the universal-primitives fallback when no project applies.
import { getMcpTypesManifestPath } from '../pipeline/paths'
import type { McpBuildArtifact } from '../pipeline/types'
import { toErrorResult, toTextResult } from './formatters'
import type { ProjectManager } from './project-manager'
import { universalPrimitivesNotice } from './universal-primitives'
import { isProjectSynced } from './workspace-discovery'

export type ProjectHandler = (
  artifact: McpBuildArtifact,
  projectPath: string
) => Promise<Record<string, unknown>> | Record<string, unknown>

export type FallbackUniversalHandler = () => Record<string, unknown>

/** The error for a project whose generated artifacts are missing. Shared by every project-scoped path. */
export function notSyncedMessage(projectPath: string): string {
  return (
    `Project at '${projectPath}' has not been synced yet.\n` +
    `Generated type artifacts are missing at '${getMcpTypesManifestPath(projectPath)}'.\n` +
    `Run 'ref sync' (or 'pnpm dev') to generate the model artifacts.`
  )
}

/**
 * The sync re-check every project-scoped answer passes through, tools and resources alike. Returns
 * the not-synced message when the project's artifacts are gone, dropping its cached model so a later
 * re-sync reloads it; returns null when the project can be answered from.
 */
export function syncFailure(projectManager: ProjectManager, projectPath: string): string | null {
  if (isProjectSynced(projectPath)) return null
  projectManager.invalidateProject(projectPath)
  return notSyncedMessage(projectPath)
}

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
  let notice: string | undefined

  if (!projectPath) {
    const fallback = fallbackUniversal()
    if ('error' in fallback && typeof fallback.error === 'string') {
      return toErrorResult(fallback.error)
    }
    return toTextResult({
      activeProject,
      ...fallback,
      notice: universalPrimitivesNotice(discovered),
    })
  }

  // Checked on every call: a project synced at session start must not keep answering from its
  // cached model once its artifacts are gone.
  const unsynced = syncFailure(projectManager, projectPath)
  if (unsynced) return toErrorResult(unsynced)

  if (discovered.length > 1 && !requestedProject) {
    notice = `Operating in active project '${projectPath}'. To change the session's project, call select_project({ path: '...' }); to query another project for one call, pass 'project' in that tool call.`
  }

  const state = projectManager.getOrCreateState(projectPath)
  const artifact = await state.waitForReady(30_000)

  if (!artifact) {
    if (state.error) {
      if (state.error.code === 'missing_artifacts') {
        return toErrorResult(notSyncedMessage(projectPath))
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
    ...(notice ? { notice } : {}),
    ...res,
  })
}
