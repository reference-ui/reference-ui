import pc from 'picocolors'
import { writeFileSync, rmSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import fg from 'fast-glob'
import { microBundle } from '../microbundle'
import type { CollectOptions, CollectOptionsPlanner } from './types'

/**
 * Scan files matching glob patterns for files calling the specified function names.
 */
function scanForFunctionCalls(
  patterns: string[],
  functionNames: string[],
  cwd: string = process.cwd()
): string[] {
  const files = fg.sync(patterns, {
    cwd,
    absolute: true,
    ignore: ['**/node_modules/**', '**/*.d.ts'],
  })

  const matches: string[] = []
  for (const file of files) {
    if (!existsSync(file)) continue

    const content = readFileSync(file, 'utf-8')
    const hasAny = functionNames.some((name) => {
      const callPattern = new RegExp(`\\b${name}\\s*\\(`)
      return callPattern.test(content)
    })
    if (hasAny) {
      matches.push(file)
    }
  }

  return matches
}

/**
 * Execute files and collect fragments using the provided collector(s).
 *
 * @example
 * ```ts
 * // Single collector with specific files
 * const fragments = await collectFragments({
 *   files: ['src/styled/button.ts'],
 *   collector: myCollector,
 * })
 *
 * // Multiple collectors with glob patterns
 * const allFragments = await collectFragments({
 *   collectors: [tokens, recipe],
 *   include: ['src/**\/*.{ts,tsx}'],
 * })
 * ```
 */
export async function collectFragments<T = unknown>(
  options: CollectOptions<T> | CollectOptionsPlanner<T>
): Promise<T[] | Record<string, T[]>> {
  if ('collectors' in options && 'include' in options) {
    return collectWithGlobPatterns(options as CollectOptionsPlanner<T>)
  }
  return collectFromFiles(options as CollectOptions<T>)
}

/**
 * Collect fragments using glob patterns and multiple collectors.
 */
async function collectWithGlobPatterns<T = unknown>(
  options: CollectOptionsPlanner<T>
): Promise<Record<string, T[]>> {
  const { collectors, include, tempDir: customTempDir } = options
  const tempDir = customTempDir ?? join(process.cwd(), '.ref', 'fragments')
  mkdirSync(tempDir, { recursive: true })

  const functionNames = collectors
    .map((c) => c.config.targetFunction)
    .filter((name): name is string => Boolean(name))

  if (functionNames.length === 0) {
    throw new Error('No targetFunction defined in collectors')
  }

  const files = scanForFunctionCalls(include, functionNames)
  const result: Record<string, T[]> = {}
  for (const collector of collectors) {
    result[collector.config.name] = []
  }

  if (files.length === 0) {
    return result
  }

  const tmpFiles: string[] = []
  try {
    for (const filePath of files) {
      // Initialize all collectors
      for (const collector of collectors) {
        collector.init()
      }

      try {
        const bundled = await microBundle(filePath)
        const tmpPath = join(
          tempDir,
          // eslint-disable-next-line sonarjs/pseudo-random -- safe: crypto not needed for temp filenames
          `frag-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`
        )
        writeFileSync(tmpPath, bundled, 'utf-8')
        tmpFiles.push(tmpPath)

        await import(pathToFileURL(tmpPath).href)

        // Collect fragments from each collector
        for (const collector of collectors) {
          const fragments = collector.getFragments()
          result[collector.config.name].push(...fragments)

          if (fragments.length > 0 && collector.config.logLabel) {
            const n = fragments.length
            const label = `${String(n).padStart(3)} ${n === 1 ? 'frag' : 'frags'}`.padEnd(10)
            const { log } = await import('../log')
            log.debug(collector.config.logLabel, pc.dim(label), filePath)
          }
        }
      } finally {
        for (const collector of collectors) {
          collector.cleanup()
        }
      }
    }
    return result
  } finally {
    for (const f of tmpFiles) {
      try {
        rmSync(f, { force: true })
      } catch {
        /* ignore cleanup errors */
      }
    }
  }
}

/**
 * Collect fragments from specified files using a single collector.
 */
async function collectFromFiles<T = unknown>(options: CollectOptions<T>): Promise<T[]> {
  const { files, collector, tempDir: customTempDir } = options
  const tempDir = customTempDir ?? join(process.cwd(), '.ref', 'fragments')
  mkdirSync(tempDir, { recursive: true })

  const allFragments: T[] = []
  const tmpFiles: string[] = []

  try {
    for (const filePath of files) {
      collector.init()

      try {
        const bundled = await microBundle(filePath)
        const tmpPath = join(
          tempDir,
          // eslint-disable-next-line sonarjs/pseudo-random -- safe: crypto not needed for temp filenames
          `frag-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`
        )
        writeFileSync(tmpPath, bundled, 'utf-8')
        tmpFiles.push(tmpPath)

        await import(pathToFileURL(tmpPath).href)

        const fragments = collector.getFragments()
        allFragments.push(...fragments)

        if (fragments.length > 0 && collector.config.logLabel) {
          const n = fragments.length
          const label = `${String(n).padStart(3)} ${n === 1 ? 'frag' : 'frags'}`.padEnd(10)
          const { log } = await import('../log')
          log.debug(collector.config.logLabel, pc.dim(label), filePath)
        }
      } finally {
        collector.cleanup()
      }
    }
    return allFragments
  } finally {
    for (const f of tmpFiles) {
      try {
        rmSync(f, { force: true })
      } catch {
        /* ignore cleanup errors */
      }
    }
  }
}
