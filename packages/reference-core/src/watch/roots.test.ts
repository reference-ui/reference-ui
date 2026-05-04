import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rm } from 'node:fs/promises'                    // ← static
import { afterEach, describe, expect, it } from 'vitest'

import { deriveWatchRoots } from './roots'

function createTempWorkspace(): string {
  return mkdtempSync(join(tmpdir(), 'reference-watch-roots-'))
}

describe('watch/roots', () => {
  const rootsToDelete: string[] = []

  afterEach(async () => {
    const toDelete = rootsToDelete.splice(0)   // copy first
    await Promise.all(
      toDelete.map((root) => rm(root, { recursive: true, force: true }))
    )
  })

  it('derives src as the only watch root for src-only include globs', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, 'src', 'components'), { recursive: true })

    expect(deriveWatchRoots(workspace, ['src/**/*.{ts,tsx}'])).toEqual([
      join(workspace, 'src'),
    ])
  })

  it('falls back to the project root for unrooted globs', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)

    expect(deriveWatchRoots(workspace, ['**/*.*'])).toEqual([workspace])
  })

  it('derives one watch root per divergent include root', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, 'src'), { recursive: true })
    mkdirSync(join(workspace, 'docs'), { recursive: true })

    expect(deriveWatchRoots(workspace, ['src/**/*.{ts,tsx}', 'docs/**/*.mdx'])).toEqual([
      join(workspace, 'src'),
      join(workspace, 'docs'),
    ])
  })

  it('dedupes identical roots derived from multiple globs', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, 'src', 'playground'), { recursive: true })

    expect(deriveWatchRoots(workspace, ['src/playground/**/*.tsx', './src/playground/**/*.mdx'])).toEqual([
      join(workspace, 'src', 'playground'),
    ])
  })

  it('collapses nested watch roots to the shallowest covering root', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, 'src', 'playground', 'fixtures'), { recursive: true })

    expect(
      deriveWatchRoots(workspace, [
        'src/playground/**/*.tsx',
        'src/playground/fixtures/**/*.ts',
      ])
    ).toEqual([join(workspace, 'src', 'playground')])
  })

  it('uses the parent directory when an include targets a single file', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, 'src'), { recursive: true })
    writeFileSync(join(workspace, 'src', 'index.ts'), 'export {}\n', 'utf-8')

    expect(deriveWatchRoots(workspace, ['src/index.ts'])).toEqual([join(workspace, 'src')])
  })

  it('falls back to the project root when any include is too broad to root safely', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, 'src'), { recursive: true })
    mkdirSync(join(workspace, 'docs'), { recursive: true })

    expect(
      deriveWatchRoots(workspace, ['src/**/*.{ts,tsx}', '**/*.*', 'docs/**/*.mdx'])
    ).toEqual([workspace])
  })

  it('adds explicit config dependency files as additional watch roots', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, 'src'), { recursive: true })
    writeFileSync(join(workspace, 'ui.config.ts'), 'export default {}\n', 'utf-8')

    expect(deriveWatchRoots(workspace, ['src/**/*.{ts,tsx}'], [join(workspace, 'ui.config.ts')])).toEqual([
      workspace,
    ])
  })
})