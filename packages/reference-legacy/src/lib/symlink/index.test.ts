import { lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { pruneBrokenSymlinksInDir } from './index'
import { prepareLinkPathForSymlink } from './prepare-link-path-for-symlink'

const created: string[] = []
afterEach(() => {
  for (const d of created.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

describe('pruneBrokenSymlinksInDir', () => {
  it('removes symlinks whose target does not exist', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-prune-'))
    created.push(root)
    const scope = join(root, 'scope')
    mkdirSync(scope, { recursive: true })
    symlinkSync(join(root, 'missing-target'), join(scope, 'stale'))

    expect(lstatSync(join(scope, 'stale')).isSymbolicLink()).toBe(true)
    pruneBrokenSymlinksInDir(scope)
    expect(() => lstatSync(join(scope, 'stale'))).toThrow()
  })

  it('keeps symlinks whose target exists', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-prune-'))
    created.push(root)
    const scope = join(root, 'scope')
    const targetDir = join(root, 'real')
    mkdirSync(scope, { recursive: true })
    mkdirSync(targetDir, { recursive: true })
    symlinkSync(targetDir, join(scope, 'ok'))

    pruneBrokenSymlinksInDir(scope)
    expect(lstatSync(join(scope, 'ok')).isSymbolicLink()).toBe(true)
  })
})

describe('prepareLinkPathForSymlink', () => {
  it('returns false when linkPath already points at targetDir', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-link-path-'))
    created.push(root)
    const scope = join(root, 'scope')
    const targetDir = join(root, 'real')
    const linkPath = join(scope, 'ok')
    mkdirSync(scope, { recursive: true })
    mkdirSync(targetDir, { recursive: true })
    symlinkSync(targetDir, linkPath)

    expect(prepareLinkPathForSymlink(linkPath, targetDir)).toBe(false)
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
  })

  it('removes an existing mismatched symlink and returns true', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-link-path-'))
    created.push(root)
    const scope = join(root, 'scope')
    const targetDir = join(root, 'real')
    const otherDir = join(root, 'other')
    const linkPath = join(scope, 'ok')
    mkdirSync(scope, { recursive: true })
    mkdirSync(targetDir, { recursive: true })
    mkdirSync(otherDir, { recursive: true })
    symlinkSync(otherDir, linkPath)

    expect(prepareLinkPathForSymlink(linkPath, targetDir)).toBe(true)
    expect(() => lstatSync(linkPath)).toThrow()
  })
})
