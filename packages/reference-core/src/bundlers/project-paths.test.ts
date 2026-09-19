/** Tests for bundler project-path resolution. */

import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_OUT_DIR } from '../constants'
import { resolveProjectPaths } from './project-paths'

const createdDirs: string[] = []

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true })
  }
})

function tempRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ref-project-paths-'))
  createdDirs.push(dir)
  return dir
}

describe('resolveProjectPaths', () => {
  it('resolves outDir directly under root when sync output exists there', () => {
    const root = tempRoot()
    mkdirSync(join(root, DEFAULT_OUT_DIR, 'react'), { recursive: true })

    const paths = resolveProjectPaths(root)

    expect(paths.projectRoot).toBe(root)
    expect(paths.outDir).toBe(join(root, DEFAULT_OUT_DIR))
  })

  it('walks up to the nearest ancestor holding sync output for nested bundler roots', () => {
    const packageRoot = tempRoot()
    mkdirSync(join(packageRoot, DEFAULT_OUT_DIR, 'react'), { recursive: true })
    const nestedRoot = join(packageRoot, 'book')
    mkdirSync(nestedRoot, { recursive: true })

    const paths = resolveProjectPaths(nestedRoot)

    expect(paths.projectRoot).toBe(packageRoot)
    expect(paths.outDir).toBe(join(packageRoot, DEFAULT_OUT_DIR))
  })

  it('prefers the nearest ancestor when several hold sync output', () => {
    const outer = tempRoot()
    mkdirSync(join(outer, DEFAULT_OUT_DIR), { recursive: true })
    const inner = join(outer, 'packages', 'lib')
    mkdirSync(join(inner, DEFAULT_OUT_DIR), { recursive: true })
    const nestedRoot = join(inner, 'book')
    mkdirSync(nestedRoot, { recursive: true })

    const paths = resolveProjectPaths(nestedRoot)

    expect(paths.projectRoot).toBe(inner)
    expect(paths.outDir).toBe(join(inner, DEFAULT_OUT_DIR))
  })

  it('falls back to root when no ancestor holds sync output', () => {
    const root = tempRoot()
    const nestedRoot = join(root, 'book')
    mkdirSync(nestedRoot, { recursive: true })

    const paths = resolveProjectPaths(nestedRoot)

    expect(paths.projectRoot).toBe(nestedRoot)
    expect(paths.outDir).toBe(join(nestedRoot, DEFAULT_OUT_DIR))
  })
})
