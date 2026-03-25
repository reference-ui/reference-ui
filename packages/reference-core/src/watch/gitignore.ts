import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const STATIC_WATCH_IGNORE = ['**/node_modules/**', '**/.reference-ui/**', '**/.git/**']

function normalizeGlobPath(value: string): string {
  return value.replaceAll('\\', '/')
}

function toWatcherIgnoreGlobs(pattern: string, sourceDir: string, gitignoreDir: string): string[] {
  const trimmed = pattern.trim()
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
    return []
  }

  const directoryOnly = trimmed.endsWith('/')
  const normalized = normalizeGlobPath(
    (directoryOnly ? trimmed.slice(0, -1) : trimmed).replace(/^\.\/+/, ''),
  )
  if (!normalized) {
    return []
  }

  if (normalized.startsWith('/')) {
    const absoluteTarget = resolve(gitignoreDir, normalized.slice(1))
    const relativeTarget = normalizeGlobPath(relative(sourceDir, absoluteTarget))
    if (!relativeTarget || relativeTarget.startsWith('..')) {
      return []
    }

    return directoryOnly
      ? [`${relativeTarget}/**`]
      : [relativeTarget, `${relativeTarget}/**`]
  }

  if (!normalized.includes('/')) {
    return directoryOnly
      ? [`**/${normalized}/**`]
      : [`**/${normalized}`, `**/${normalized}/**`]
  }

  return directoryOnly
    ? [`**/${normalized}/**`]
    : [`**/${normalized}`, `**/${normalized}/**`]
}

function collectGitignoreWatchIgnores(sourceDir: string): string[] {
  const ignores = new Set<string>()
  let currentDir = resolve(sourceDir)

  while (true) {
    const gitignorePath = join(currentDir, '.gitignore')
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf-8')
      for (const line of gitignore.split(/\r?\n/)) {
        for (const glob of toWatcherIgnoreGlobs(line, sourceDir, currentDir)) {
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

export function getWatchIgnoreGlobs(sourceDir: string): string[] {
  return [...STATIC_WATCH_IGNORE, ...collectGitignoreWatchIgnores(sourceDir)]
}
