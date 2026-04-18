import { basename, dirname, extname, relative, resolve, sep } from 'node:path'
import fg from 'fast-glob'
import { trace } from '@reference-ui/rust/styletrace'
import { SYNC_OUTPUT_DIR_GLOB } from '../../../constants'
import { log } from '../../../lib/log'

const STYLETRACE_SOURCE_EXTENSIONS = new Set(['.tsx', '.jsx'])
const STYLETRACE_BARREL_EXTENSIONS = new Set(['.ts', '.js', '.mts'])

const STYLETRACE_GLOB_CONFIG = {
  onlyFiles: true,
  absolute: true,
  ignore: ['**/node_modules/**', SYNC_OUTPUT_DIR_GLOB, '**/.git/**'],
}

function collapseNestedRoots(roots: string[]): string[] {
  const sortedRoots = [...new Set(roots)].sort((a, b) => a.length - b.length)
  const collapsed: string[] = []

  for (const root of sortedRoots) {
    const normalizedRoot = root.endsWith('/') ? root : `${root}/`
    if (
      collapsed.some((existing) =>
        normalizedRoot.startsWith(existing.endsWith('/') ? existing : `${existing}/`)
      )
    ) {
      continue
    }
    collapsed.push(root)
  }

  return collapsed
}

function isTraceableEntryFile(projectRoot: string, filePath: string): boolean {
  const extension = extname(filePath)
  if (STYLETRACE_SOURCE_EXTENSIONS.has(extension)) {
    return true
  }

  if (!STYLETRACE_BARREL_EXTENSIONS.has(extension) || basename(filePath, extension) !== 'index') {
    return false
  }

  const relativePath = relative(projectRoot, filePath)
  const segments = relativePath.split(sep)
  return segments.length > 2
}

export async function resolveStyletraceRoots(cwd: string, include: string[]): Promise<string[]> {
  if (include.length === 0) {
    return []
  }

  const projectRoot = resolve(cwd)
  const files = await fg(include, {
    cwd: projectRoot,
    ...STYLETRACE_GLOB_CONFIG,
  })
  const jsxBearingFiles = files.filter((filePath) => isTraceableEntryFile(projectRoot, filePath))

  if (jsxBearingFiles.length === 0) {
    return []
  }

  return collapseNestedRoots(jsxBearingFiles.map((filePath) => dirname(filePath))).sort()
}

export async function traceIncludedJsxElements(cwd: string, include: string[]): Promise<string[]> {
  const roots = await resolveStyletraceRoots(cwd, include)
  if (roots.length === 0) {
    return []
  }

  const results = await Promise.allSettled(roots.map(async (root) => ({ root, names: await trace(root) })))

  const tracedNames: string[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      tracedNames.push(...result.value.names)
      continue
    }

    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason)
    log.warn('[config] skipping styletrace root after analysis failure', reason)
  }

  return [...new Set(tracedNames)].sort()
}