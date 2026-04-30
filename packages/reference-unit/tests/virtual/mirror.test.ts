import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import {
  virtualDir,
  waitFor,
  getSourcePaths,
  getVirtualPaths,
  virtualToPossibleSources,
  EXTENSION_TRANSFORMS,
} from './helpers'

/**
 * Virtual mirrors src: same files, no orphans, no missing.
 * watch:change → run:virtual:sync:file removes files from virtual on unlink.
 */
describe('virtual – mirror invariant', () => {
  it('virtual has no orphan files (every virtual file has a source counterpart)', async () => {
    const sourcePaths = () => new Set(getSourcePaths())
    const getOrphans = () => {
      const virtualPaths = getVirtualPaths()
      const src = sourcePaths()
      const list: string[] = []
      for (const vRel of virtualPaths) {
        if (vRel.startsWith('_reference-component/')) continue
        if (vRel.startsWith('__reference__ui/')) continue
        const candidates = virtualToPossibleSources(vRel)
        if (!candidates.some((c) => src.has(c))) list.push(vRel)
      }
      return list
    }

    const ok = await waitFor(() => getOrphans().length === 0, { timeoutMs: 3000 })
    const orphans = getOrphans()
    expect(ok, `Orphan files in virtual (no source): ${orphans.join(', ')}`).toBe(true)
  })

  it('virtual has all source files (no missing)', async () => {
    const getMissing = () => {
      const sourcePaths = getSourcePaths()
      const list: string[] = []
      for (const sRel of sourcePaths) {
        const ext = extname(sRel)
        const outExt = EXTENSION_TRANSFORMS[ext] ?? ext
        const virtualRel = sRel.slice(0, -ext.length) + outExt
        const abs = join(virtualDir, virtualRel)
        if (!existsSync(abs)) list.push(sRel)
      }
      return list
    }

    const ok = await waitFor(() => getMissing().length === 0, { timeoutMs: 3000 })
    const missing = getMissing()
    expect(ok, `Missing in virtual (source exists): ${missing.join(', ')}`).toBe(true)
  })
})
