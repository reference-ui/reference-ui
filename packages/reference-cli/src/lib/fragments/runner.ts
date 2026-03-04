import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { microBundle } from '../microbundle'
import { scanForFragments } from './scanner'
import type {
  BundleFragmentsOptions,
  CollectOptions,
  CollectOptionsPlanner,
  FragmentBundle,
  FragmentCollector,
} from './types'

// ---------------------------------------------------------------------------
// Bundle-only: returns portable IIFE strings, does not execute
// ---------------------------------------------------------------------------

export async function bundleFragments(
  options: BundleFragmentsOptions
): Promise<FragmentBundle[]> {
  const { files } = options
  const results: FragmentBundle[] = []
  for (const file of files) {
    const bundle = await microBundle(file, { format: 'iife' })
    results.push({ file, bundle })
  }
  return results
}

// ---------------------------------------------------------------------------
// Collect: executes bundles, returns plain data objects
// ---------------------------------------------------------------------------

export async function collectFragments<T>(options: CollectOptions<T>): Promise<T[]>
export async function collectFragments(
  options: CollectOptionsPlanner
): Promise<Record<string, unknown[]>>
export async function collectFragments<T>(
  options: CollectOptions<T> | CollectOptionsPlanner
): Promise<T[] | Record<string, unknown[]>> {
  if ('collectors' in options) {
    return runPlanner(options)
  }
  return runSingle(options)
}

// ---------------------------------------------------------------------------
// Single-collector: caller passes resolved file paths explicitly
// ---------------------------------------------------------------------------

async function runSingle<T>(options: CollectOptions<T>): Promise<T[]> {
  const { files, collector, tempDir } = options
  mkdirSync(tempDir, { recursive: true })

  const allFragments: T[] = []

  for (const filePath of files) {
    const tmpPath = uniqueTmpPath(tempDir)
    collector.init()
    try {
      const bundled = await microBundle(filePath)
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

function initAll(collectors: FragmentCollector<unknown>[]): void {
  for (const c of collectors) c.init()
}

function cleanupAll(collectors: FragmentCollector<unknown>[]): void {
  for (const c of collectors) c.cleanup()
}

function removeSilently(path: string): void {
  try {
    rmSync(path, { force: true })
  } catch {
    /* ignore */
  }
}
