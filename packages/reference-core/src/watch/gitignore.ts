import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const STATIC_WATCH_IGNORE = ['**/node_modules/**', '**/.reference-ui/**', '**/.git/**']

function normalizeGlobPath(value: string): string {
  return value.replaceAll('\\', '/')
}

export function toWatcherIgnoreGlobs(
  pattern: string,
  watchRoot: string,
  gitignoreDir: string
): string[] {
  const trimmed = pattern.trim()
  if (shouldIgnorePattern(trimmed)) {
    return []
  }

  const directoryOnly = trimmed.endsWith('/')
  const normalized = normalizePattern(trimmed, directoryOnly)
  if (!normalized) {
    return []
  }

  if (isAnchoredPattern(normalized)) {
    return toAnchoredWatchIgnoreGlobs(normalized, directoryOnly, watchRoot, gitignoreDir)
  }

  return toBasenameWatchIgnoreGlobs(normalized, directoryOnly)
}

function shouldIgnorePattern(pattern: string): boolean {
  return !pattern || pattern.startsWith('#') || pattern.startsWith('!')
}

function normalizePattern(pattern: string, directoryOnly: boolean): string {
  return normalizeGlobPath(
    (directoryOnly ? pattern.slice(0, -1) : pattern).replace(/^\.\/+/, '')
  )
}

function isAnchoredPattern(pattern: string): boolean {
  return pattern.startsWith('/') || pattern.includes('/')
}

function toAnchoredWatchIgnoreGlobs(
  pattern: string,
  directoryOnly: boolean,
  watchRoot: string,
  gitignoreDir: string
): string[] {
  const relativePattern = pattern.startsWith('/') ? pattern.slice(1) : pattern
  const absoluteTarget = resolve(gitignoreDir, relativePattern)
  const relativeTarget = normalizeGlobPath(relative(watchRoot, absoluteTarget))
  if (!relativeTarget || relativeTarget.startsWith('..')) {
    return []
  }

  return directoryOnly
    ? [`${relativeTarget}/**`]
    : [relativeTarget, `${relativeTarget}/**`]
}

function toBasenameWatchIgnoreGlobs(pattern: string, directoryOnly: boolean): string[] {
  return directoryOnly ? [`**/${pattern}/**`] : [`**/${pattern}`, `**/${pattern}/**`]
}

function collectGitignoreWatchIgnores(watchRoot: string): string[] {
  const ignores = new Set<string>()
  let currentDir = resolve(watchRoot)

  while (true) {
    const gitignorePath = join(currentDir, '.gitignore')
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf-8')
      for (const line of gitignore.split(/\r?\n/)) {
        for (const glob of toWatcherIgnoreGlobs(line, watchRoot, currentDir)) {
          ignores.add(glob)
        }
      }
    }

    if (existsSync(join(currentDir, '.git'))) {
      break
    }

    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      break
    }
    currentDir = parentDir
  }

  return [...ignores]
}

export function getWatchIgnoreGlobs(watchRoot: string): string[] {
  return [...STATIC_WATCH_IGNORE, ...collectGitignoreWatchIgnores(watchRoot)]
}
