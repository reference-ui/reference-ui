import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'

import {
  extensionTransforms,
  getSourcePaths,
  getVirtualPaths,
  virtualDir,
  virtualToPossibleSources,
  waitFor,
} from './helpers'

describe('virtual mirror invariant', () => {
  it('virtual has no orphan files', async () => {
    const sourcePaths = () => new Set(getSourcePaths())
    const getOrphans = () => {
      const virtualPaths = getVirtualPaths()
      const source = sourcePaths()
      const output: string[] = []

      for (const virtualRelativePath of virtualPaths) {
        if (virtualRelativePath.startsWith('_reference-component/')) {
          continue
        }

        const candidates = virtualToPossibleSources(virtualRelativePath)

        if (!candidates.some((candidate) => source.has(candidate))) {
          output.push(virtualRelativePath)
        }
      }

      return output
    }

    const completed = await waitFor(() => getOrphans().length === 0, { timeoutMs: 3_000 })
    const orphans = getOrphans()
    expect(completed, `Orphan files in virtual output: ${orphans.join(', ')}`).toBe(true)
  })

  it('virtual has all source files', async () => {
    const getMissing = () => {
      const sourcePaths = getSourcePaths()
      const output: string[] = []

      for (const sourceRelativePath of sourcePaths) {
        const extension = extname(sourceRelativePath)
        const outputExtension = extensionTransforms[extension] ?? extension
        const virtualRelativePath = sourceRelativePath.slice(0, -extension.length) + outputExtension
        const absolutePath = join(virtualDir, virtualRelativePath)

        if (!existsSync(absolutePath)) {
          output.push(sourceRelativePath)
        }
      }

      return output
    }

    const completed = await waitFor(() => getMissing().length === 0, { timeoutMs: 3_000 })
    const missing = getMissing()
    expect(completed, `Missing files in virtual output: ${missing.join(', ')}`).toBe(true)
  })
}