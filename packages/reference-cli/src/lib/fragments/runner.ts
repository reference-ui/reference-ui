import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { microBundle, DEFAULT_EXTERNALS } from '../microbundle'
import { scanForFragments } from './scanner'
import type {
  BundleCollectorRuntimeOptions,
  BundleFragmentsOptions,
  CollectOptions,
  CollectOptionsPlanner,
  CollectorBundleCollection,
  CollectorForPlanner,
  FragmentBundle,
} from './types'

// ---------------------------------------------------------------------------
// Bundle-only: returns portable IIFE strings, does not execute
// ---------------------------------------------------------------------------

export async function bundleFragments(
  options: BundleFragmentsOptions
): Promise<FragmentBundle[]> {
  const { files, alias, external = [] } = options
  const results: FragmentBundle[] = []
  const microOptions = {
    format: 'iife' as const,
    ...(alias && { alias }),
    external: [...DEFAULT_EXTERNALS, ...external],
  }
  for (const file of files) {
    const bundle = await microBundle(file, microOptions)
    results.push({ file, bundle })
  }
  return results
}

export async function bundleCollectorRuntime(
  options: BundleCollectorRuntimeOptions
): Promise<CollectorBundleCollection> {
  const { files, collectors, alias, external = [] } = options
  const bundles =
    files.length > 0
      ? (
          await bundleFragments({
            files,
            ...(alias && { alias }),
            external,
          })
        )
          .map(({ bundle }) => `;${bundle}`)
          .join('\n')
      : ''

  const values = collectors.map((collector) => ({
    name: collector.config.name,
    expression: collector.toGetter(),
  }))

  return {
    bundles,
    collectorSetup: collectors
      .flatMap((collector) => [collector.toScript(), collector.toRuntimeFunction()])
      .join('\n'),
    values,
    getValue(name: string) {
      return values.find((value) => value.name === name)?.expression ?? '[]'
    },
  }
}

// ---------------------------------------------------------------------------
// Collect: executes bundles, returns plain data objects
// ---------------------------------------------------------------------------

export async function collectFragments<TInput, TOutput = TInput>(
  options: CollectOptions<TInput, TOutput>
): Promise<TOutput[]>
export async function collectFragments(
  options: CollectOptionsPlanner
): Promise<Record<string, unknown[]>>
export async function collectFragments<TInput, TOutput>(
  options: CollectOptions<TInput, TOutput> | CollectOptionsPlanner
): Promise<TOutput[] | Record<string, unknown[]>> {
  if ('collectors' in options) {
    return runPlanner(options)
  }
  return runSingle(options)
}

// ---------------------------------------------------------------------------
// Single-collector: caller passes resolved file paths explicitly
// ---------------------------------------------------------------------------

async function runSingle<TInput, TOutput>(
  options: CollectOptions<TInput, TOutput>
): Promise<TOutput[]> {
  const { files, collector, tempDir, alias, external = [] } = options
  mkdirSync(tempDir, { recursive: true })

  const microOptions = {
    ...(alias && { alias }),
    external: [...DEFAULT_EXTERNALS, ...external],
  }

  const allFragments: TOutput[] = []

  for (const filePath of files) {
    const tmpPath = uniqueTmpPath(tempDir)
    collector.init()
    try {
      const bundled = await microBundle(filePath, microOptions)
      writeFileSync(tmpPath, bundled, 'utf-8')
      await import(pathToFileURL(tmpPath).href)
      allFragments.push(...collector.getFragments())
    } finally {
      collector.cleanup()
      removeSilently(tmpPath)
    }
  }

  return allFragments
}

// ---------------------------------------------------------------------------
// Planner: scans via globs, runs all collectors in one pass per file
// ---------------------------------------------------------------------------

async function runPlanner(
  options: CollectOptionsPlanner
): Promise<Record<string, unknown[]>> {
  const { collectors, include, tempDir, cwd } = options
  mkdirSync(tempDir, { recursive: true })

  // Derive function names to scan for from each collector's config
  const functionNames = collectors.map(c => c.config.targetFunction ?? c.config.name)
  const files = scanForFragments({ include, functionNames, cwd })

  // Pre-seed result keyed by collector name
  const result: Record<string, unknown[]> = {}
  for (const c of collectors) {
    result[c.config.name] = []
  }

  for (const filePath of files) {
    const tmpPath = uniqueTmpPath(tempDir)
    initAll(collectors)
    try {
      const bundled = await microBundle(filePath)
      writeFileSync(tmpPath, bundled, 'utf-8')
      await import(pathToFileURL(tmpPath).href)
      for (const c of collectors) {
        result[c.config.name].push(...c.getFragments())
      }
    } finally {
      cleanupAll(collectors)
      removeSilently(tmpPath)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueTmpPath(dir: string): string {
  return join(dir, `frag-${Date.now()}-${randomBytes(6).toString('hex')}.mjs`)
}

function initAll(collectors: CollectorForPlanner[]): void {
  for (const c of collectors) c.init()
}

function cleanupAll(collectors: CollectorForPlanner[]): void {
  for (const c of collectors) c.cleanup()
}

function removeSilently(path: string): void {
  try {
    rmSync(path, { force: true })
  } catch {
    /* ignore */
  }
}
