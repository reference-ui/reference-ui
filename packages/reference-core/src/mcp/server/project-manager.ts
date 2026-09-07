import { existsSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { resolveRefConfigFile } from '../../lib/paths'
import { GlobalProjectRegistry } from '../../lib/paths/global-registry'
import {
  discoverProjects,
  type DiscoveredProject,
  type DiscoverProjectsOptions,
} from '../../lib/paths/workspace-discovery'
import { createDeferred, type Deferred } from './deferred'
import { createMcpModelState, type McpModelState } from './model-state'

export interface SelectProjectSuccess {
  status: 'active'
  project: string
  configPath: string
}

export interface SelectProjectFailure {
  error: string
}

export type SelectProjectResult = SelectProjectSuccess | SelectProjectFailure

export interface ListProjectsResult {
  [key: string]: unknown
  activeProject: string | null
  projects: Array<DiscoveredProject & { isDefault: boolean }>
  sanitizedStaleCount: number
}

export function compareProjectsByLastActive(
  a: DiscoveredProject,
  b: DiscoveredProject
): number {
  const timeA = a.lastActive ? new Date(a.lastActive).getTime() : 0
  const timeB = b.lastActive ? new Date(b.lastActive).getTime() : 0
  if (timeA !== timeB) return timeB - timeA
  return a.path.localeCompare(b.path)
}

export class ProjectManager {
  readonly workspaceRoot: string
  readonly explicitProject: string | null
  private activeProjectPath: string | null = null
  private projectCache = new Map<string, McpModelState>()
  private discoveredProjects: DiscoveredProject[] = []
  private discoveryDeferred: Deferred<void> = createDeferred()

  constructor(workspaceRoot: string, options?: { project?: string }) {
    this.workspaceRoot = this.canonicalize(workspaceRoot)
    this.explicitProject = options?.project ?? process.env.REF_PROJECT ?? null
  }

  /**
   * Non-blocking initialization. Called AFTER transport connects.
   */
  async initialize(): Promise<void> {
    try {
      this.discoveredProjects = discoverProjects(this.workspaceRoot)
      const defaultPath = this.pickDefault()
      if (defaultPath) {
        this.activeProjectPath = defaultPath
        // Fire-and-forget warmup — do NOT await
        this.getOrCreateState(defaultPath).warmStart().catch(() => {})
      }
    } finally {
      this.discoveryDeferred.resolve()
    }
  }

  /**
   * Tool handlers await this before accessing projects. Fast (< 50ms).
   */
  async waitForDiscovery(): Promise<void> {
    return this.discoveryDeferred.promise
  }

  getActiveProject(): string | null {
    this.pruneActiveProjectIfMissing()
    return this.activeProjectPath
  }

  getDiscoveredProjects(): DiscoveredProject[] {
    return this.discoveredProjects
  }

  resolveProject(requested?: string): string | null {
    if (requested) {
      return this.matchProjectPath(requested)
    }
    return this.getActiveProject()
  }

  selectProject(rawPath: string): SelectProjectResult {
    const matched = this.matchProjectPath(rawPath)
    if (!matched) {
      return {
        error: `No project found at '${rawPath}'. Run list_projects() to see available projects.`,
      }
    }

    const configPath = resolveRefConfigFile(matched)
    if (!configPath) {
      return {
        error: `No ui.config.* found at '${matched}'.`,
      }
    }

    this.activeProjectPath = matched
    this.getOrCreateState(matched).warmStart().catch(() => {})

    try {
      GlobalProjectRegistry.upsert(matched)
    } catch {
      // Best-effort registry tracking
    }

    return {
      status: 'active',
      project: matched,
      configPath,
    }
  }

  listProjects(options?: DiscoverProjectsOptions): ListProjectsResult {
    this.pruneActiveProjectIfMissing()
    const { sanitizedCount } = GlobalProjectRegistry.read()
    const projects = discoverProjects(this.workspaceRoot, options)
    this.discoveredProjects = projects

    const mapped = projects.map(p => ({
      ...p,
      isDefault: p.path === this.activeProjectPath,
    }))

    return {
      activeProject: this.activeProjectPath,
      projects: mapped,
      sanitizedStaleCount: sanitizedCount,
    }
  }

  getOrCreateState(projectPath: string): McpModelState {
    const canonical = this.canonicalize(projectPath)
    let state = this.projectCache.get(canonical)
    if (!state) {
      state = createMcpModelState({ cwd: canonical })
      this.projectCache.set(canonical, state)
    }
    return state
  }

  invalidateProject(projectPath: string): void {
    const canonical = this.canonicalize(projectPath)
    this.projectCache.delete(canonical)
  }

  clearCache(): void {
    this.projectCache.clear()
  }

  private pruneActiveProjectIfMissing(): void {
    if (this.activeProjectPath && !existsSync(this.activeProjectPath)) {
      this.activeProjectPath = null
    }
  }

  private canonicalize(rawPath: string): string {
    const resolved = resolve(rawPath)
    try {
      return realpathSync(resolved)
    } catch {
      return resolved
    }
  }

  private pickDefault(): string | null {
    // 1. Explicit CLI --project or REF_PROJECT
    if (this.explicitProject) {
      const explicit = this.matchProjectPath(this.explicitProject)
      if (explicit) return explicit
    }

    // 2. CWD contains ui.config.*
    const cwdMatch = this.discoveredProjects.find(p => p.source === 'cwd')
    if (cwdMatch) return cwdMatch.path

    // 3. Ancestor search
    const ancestorMatch = this.discoveredProjects.find(p => p.source === 'ancestor')
    if (ancestorMatch) return ancestorMatch.path

    // 4. Workspace projects
    const workspaceProjects = this.discoveredProjects.filter(p => p.source === 'workspace')
    if (workspaceProjects.length === 1) {
      return workspaceProjects[0].path
    }
    if (workspaceProjects.length > 1) {
      const sorted = [...workspaceProjects].sort(compareProjectsByLastActive)
      return sorted[0].path
    }

    // 5. Global registry projects
    const registryProjects = this.discoveredProjects.filter(p => p.source === 'global_registry')
    if (registryProjects.length > 0) {
      const sorted = [...registryProjects].sort(compareProjectsByLastActive)
      return sorted[0].path
    }

    return null
  }

  private matchProjectPath(raw: string): string | null {
    const normalized = raw.trim().replace(/\\/g, '/').replace(/\/+$/, '')
    if (!normalized) return null

    // 1. If absolute path or relative path exists directly
    const target = isAbsolute(normalized)
      ? this.canonicalize(normalized)
      : this.canonicalize(resolve(this.workspaceRoot, normalized))

    if (existsSync(target)) {
      const directConfig = resolveRefConfigFile(target)
      if (directConfig) return target

      // Subdirectory walk-up
      let current = target
      while (true) {
        const parent = dirname(current)
        if (parent === current) break
        const parentConfig = resolveRefConfigFile(parent)
        if (parentConfig) return this.canonicalize(parent)
        if (existsSync(resolve(parent, '.git'))) break
        current = parent
      }
    }

    // 2. Match against discovered projects by full path or path segment boundary
    const normalizedTarget = target.replace(/\\/g, '/')
    const matchSuffix = this.discoveredProjects.find(p => {
      const normP = p.path.replace(/\\/g, '/')
      return (
        normP === normalizedTarget ||
        normP === normalized ||
        normP.endsWith(`/${normalized}`)
      )
    })

    if (matchSuffix) {
      return matchSuffix.path
    }

    return null
  }
}
