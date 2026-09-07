import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import fg from 'fast-glob'
import { resolveRefConfigFile, GlobalProjectRegistry } from '@reference-ui/core/paths'

export const SCAN_EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.reference-ui',
  'coverage',
  '.turbo',
  '.nx',
  '__tests__',
  '.cache',
  '.output',
  'target',
])

export type ProjectSource = 'cwd' | 'ancestor' | 'workspace' | 'global_registry' | 'scan'

export interface DiscoveredProject {
  path: string
  configPath: string
  source: ProjectSource
  hasArtifacts: boolean
  isDefault?: boolean
  lastActive?: string
}

export interface DiscoverProjectsOptions {
  scanPath?: string
  maxDepth?: number
}

function canonicalizePath(rawPath: string): string {
  const resolved = resolve(rawPath)
  try {
    return realpathSync(resolved)
  } catch {
    return resolved
  }
}

function checkArtifacts(projectPath: string): boolean {
  return existsSync(join(projectPath, '.reference-ui', 'mcp', 'model.json'))
}

function parsePnpmWorkspaceGlobs(workspaceRoot: string): string[] {
  const yamlPath = join(workspaceRoot, 'pnpm-workspace.yaml')
  if (!existsSync(yamlPath)) return []

  try {
    const content = readFileSync(yamlPath, 'utf8')
    const match = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/)
    if (!match || !match[1]) return []

    const lines = match[1].split('\n')
    const globs: string[] = []
    for (const line of lines) {
      const lineMatch = line.match(/^\s*-\s*['"]?([^'"#\r\n]+)['"]?/)
      if (lineMatch && lineMatch[1]) {
        globs.push(lineMatch[1].trim())
      }
    }
    return globs
  } catch {
    return []
  }
}

function parsePackageJsonWorkspaceGlobs(workspaceRoot: string): string[] {
  const pkgPath = join(workspaceRoot, 'package.json')
  if (!existsSync(pkgPath)) return []

  try {
    const raw = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      workspaces?: string[] | { packages?: string[] }
    }
    if (Array.isArray(raw.workspaces)) {
      return raw.workspaces
    }
    if (raw.workspaces && Array.isArray(raw.workspaces.packages)) {
      return raw.workspaces.packages
    }
    return []
  } catch {
    return []
  }
}

function walkUpAncestorProjects(startDir: string): DiscoveredProject[] {
  const ancestors: DiscoveredProject[] = []
  let current = resolve(startDir)

  // Start from parent of startDir
  while (true) {
    const parent = dirname(current)
    if (parent === current) break // reached root

    const configPath = resolveRefConfigFile(parent)
    if (configPath) {
      const canonical = canonicalizePath(parent)
      ancestors.push({
        path: canonical,
        configPath,
        source: 'ancestor',
        hasArtifacts: checkArtifacts(canonical),
      })
    }

    // Stop at Git boundary
    if (existsSync(join(parent, '.git'))) {
      break
    }

    current = parent
  }

  return ancestors
}

function scanDirectoryBounded(
  rootDir: string,
  maxDepth: number,
  maxResults = 50,
): DiscoveredProject[] {
  const results: DiscoveredProject[] = []
  const visitedRealPaths = new Set<string>()

  function traverse(dir: string, depth: number) {
    if (depth > maxDepth || results.length >= maxResults) return

    let canonicalDir: string
    try {
      canonicalDir = realpathSync(dir)
    } catch {
      return
    }

    if (visitedRealPaths.has(canonicalDir)) return
    visitedRealPaths.add(canonicalDir)

    let entries: string[] = []
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      if (results.length >= maxResults) return
      if (SCAN_EXCLUDE_DIRS.has(entry) || entry.startsWith('.')) continue

      const fullPath = join(dir, entry)
      let isDir = false
      try {
        const stat = statSync(fullPath)
        isDir = stat.isDirectory()
      } catch {
        continue
      }

      if (!isDir) continue

      const configPath = resolveRefConfigFile(fullPath)
      if (configPath) {
        const canonical = canonicalizePath(fullPath)
        results.push({
          path: canonical,
          configPath,
          source: 'scan',
          hasArtifacts: checkArtifacts(canonical),
        })
      }

      traverse(fullPath, depth + 1)
    }
  }

  traverse(rootDir, 1)
  return results
}

export function discoverProjects(
  workspaceRoot: string,
  options?: DiscoverProjectsOptions,
): DiscoveredProject[] {
  const normalizedRoot = canonicalizePath(workspaceRoot)
  const projectMap = new Map<string, DiscoveredProject>()

  function addProject(project: DiscoveredProject) {
    const canonical = canonicalizePath(project.path)
    const existing = projectMap.get(canonical)
    if (!existing) {
      projectMap.set(canonical, { ...project, path: canonical })
    }
  }

  // Tier 1: Current Working Directory
  const cwdConfig = resolveRefConfigFile(normalizedRoot)
  if (cwdConfig) {
    addProject({
      path: normalizedRoot,
      configPath: cwdConfig,
      source: 'cwd',
      hasArtifacts: checkArtifacts(normalizedRoot),
    })
  }

  // Tier 2: Ancestor Search (Up)
  const ancestors = walkUpAncestorProjects(normalizedRoot)
  for (const p of ancestors) {
    addProject(p)
  }

  // Tier 3: Downward Workspace Scan
  const workspaceGlobs = [
    ...parsePnpmWorkspaceGlobs(normalizedRoot),
    ...parsePackageJsonWorkspaceGlobs(normalizedRoot),
  ]

  if (workspaceGlobs.length > 0) {
    const positivePatterns: string[] = []
    const ignorePatterns: string[] = Array.from(SCAN_EXCLUDE_DIRS).map(d => `**/${d}/**`)

    for (const g of workspaceGlobs) {
      if (g.startsWith('!')) {
        ignorePatterns.push(g.slice(1))
      } else {
        positivePatterns.push(g)
      }
    }

    if (positivePatterns.length > 0) {
      try {
        const matchedDirs = fg.sync(positivePatterns, {
          cwd: normalizedRoot,
          onlyDirectories: true,
          ignore: ignorePatterns,
          absolute: true,
        })

        for (const dir of matchedDirs) {
          const config = resolveRefConfigFile(dir)
          if (config) {
            const canonical = canonicalizePath(dir)
            addProject({
              path: canonical,
              configPath: config,
              source: 'workspace',
              hasArtifacts: checkArtifacts(canonical),
            })
          }
        }
      } catch {
        // Ignore glob expansion errors
      }
    }
  }

  // Tier 0: Global Registry
  const { projects: registryProjects } = GlobalProjectRegistry.read()
  for (const [regPath, entry] of Object.entries(registryProjects)) {
    if (entry && entry.configPath && existsSync(entry.configPath)) {
      const canonical = canonicalizePath(regPath)
      addProject({
        path: canonical,
        configPath: entry.configPath,
        source: 'global_registry',
        hasArtifacts: checkArtifacts(canonical),
        lastActive: entry.lastActive,
      })
    }
  }

  // Tier 5: Targeted Scan (if scanPath specified)
  if (options?.scanPath) {
    const scanDir = isAbsolute(options.scanPath)
      ? options.scanPath
      : resolve(normalizedRoot, options.scanPath)

    if (existsSync(scanDir)) {
      const maxDepth = Math.max(1, Math.min(5, options.maxDepth ?? 3))
      const scanned = scanDirectoryBounded(scanDir, maxDepth)
      for (const p of scanned) {
        addProject(p)
      }
    }
  }

  return Array.from(projectMap.values())
}
