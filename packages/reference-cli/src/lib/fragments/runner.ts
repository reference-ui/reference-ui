import pc from 'picocolors'
import { writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { microBundle } from '../microbundle'
import type { CollectOptions } from './types'

/**
 * Execute files and collect fragments using the provided collector.
 * Each file is:
 * 1. Bundled with microbundle (resolves imports, TypeScript, etc.)
 * 2. Written to a temp file
 * 3. Imported to execute side effects (fragment collection)
 * 4. Cleaned up
 *
 * @example
 * ```ts
 * const collector = createFragmentCollector({ name: 'panda', globalKey: '__panda' })
 * const fragments = await collectFragments({
 *   files: ['src/styled/button.ts', 'src/styled/input.ts'],
 *   collector,
 * })
 * ```
 */
// eslint-disable-next-line max-statements -- complex but clear async flow
export async function collectFragments<T = unknown>(
  options: CollectOptions<T>
): Promise<T[]> {
  const { files, collector, tempDir: customTempDir } = options
  const allFragments: T[] = []
  const tempDir = customTempDir ?? join(process.cwd(), '.ref', 'fragments')
  mkdirSync(tempDir, { recursive: true })
  const tmpFiles: string[] = []

  try {
    for (const filePath of files) {
      // Initialize collector for this file
      collector.init()

      try {
        // Bundle the file with all its dependencies
        const bundled = await microBundle(filePath)

        // Write to temp file so Node can import it
        const tmpPath = join(
          tempDir,
          // eslint-disable-next-line sonarjs/pseudo-random -- safe: crypto not needed for temp filenames
          `frag-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`
        )
        writeFileSync(tmpPath, bundled, 'utf-8')
        tmpFiles.push(tmpPath)

        // Import (executes the code, which calls collector.collect())
        await import(pathToFileURL(tmpPath).href)

        // Get fragments collected from this file
        const fragments = collector.getFragments()
        allFragments.push(...fragments)

        // Log for debugging
        const n = fragments.length
        const label = `${String(n).padStart(3)} ${n === 1 ? 'frag' : 'frags'}`.padEnd(10)
        if (collector.config.logLabel) {
          // Only import log if we need it (lazy)
          const { log } = await import('../log')
          log.debug(collector.config.logLabel, pc.dim(label), filePath)
        }
      } finally {
        // Clean up collector for this file
        collector.cleanup()
      }
    }

    return allFragments
  } finally {
    // Clean up all temp files
    for (const f of tmpFiles) {
      try {
        rmSync(f, { force: true })
      } catch {
        /* ignore cleanup errors */
      }
    }
  }
}
