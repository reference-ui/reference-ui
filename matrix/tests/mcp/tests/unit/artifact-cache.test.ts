/**
 * MCP artifact cache-key suite. Builds throwaway project fixtures in tmp dirs
 * and asserts `computeMcpArtifactCacheKey` over them. Pure unit coverage;
 * the only suite here that never starts a server at all.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { computeMcpArtifactCacheKey } from './helpers/artifact'

const tempDirs: string[] = []

function makeFixture(): string {
  const cwd = mkdtempSync(join(tmpdir(), 'mcp-cache-key-'))
  tempDirs.push(cwd)
  mkdirSync(join(cwd, 'src', 'components'), { recursive: true })
  writeFileSync(join(cwd, 'src', 'index.ts'), 'export const value = 1\n')
  writeFileSync(join(cwd, 'src', 'components', 'index.tsx'), 'export const Box = null\n')
  writeFileSync(join(cwd, 'ui.config.ts'), 'export default {}\n')
  writeFileSync(join(cwd, 'package.json'), '{ "name": "fixture" }\n')
  return cwd
}

describe('mcp artifact cache key', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('is stable while the inputs are unchanged', () => {
    const cwd = makeFixture()
    expect(computeMcpArtifactCacheKey(cwd)).toBe(computeMcpArtifactCacheKey(cwd))
  })

  it('changes when a fixture source file changes', () => {
    const cwd = makeFixture()
    const before = computeMcpArtifactCacheKey(cwd)
    writeFileSync(join(cwd, 'src', 'components', 'index.tsx'), 'export const Box = 1\n')
    expect(computeMcpArtifactCacheKey(cwd)).not.toBe(before)
  })

  it('ignores installed dependencies under src', () => {
    const cwd = makeFixture()
    const before = computeMcpArtifactCacheKey(cwd)
    mkdirSync(join(cwd, 'src', 'node_modules', 'dep'), { recursive: true })
    writeFileSync(join(cwd, 'src', 'node_modules', 'dep', 'index.js'), 'module.exports = 1\n')
    expect(computeMcpArtifactCacheKey(cwd)).toBe(before)
  })
})
