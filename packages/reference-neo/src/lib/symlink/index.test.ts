// Unit tests for the symlink helpers over temp dirs.
// They take fresh scratch roots per case and pin create/prune/remove plus
// link-path readiness: already-correct links stay, mismatched ones clear,
// and generated-link removal never touches hand-placed entries. Auto-cleaned
// after each case, Windows-safe assertions only.
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { createSymlink, pruneBrokenSymlinksInDir, removeGeneratedLink } from './index.ts'
import { prepareLinkPathForSymlink } from './prepare.ts'

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

describe('createSymlink', () => {
  it('throws when the target is not an existing directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-create-'))
    created.push(root)
    const scope = join(root, 'scope')
    mkdirSync(scope, { recursive: true })

    expect(() => createSymlink(join(root, 'missing'), join(scope, 'pkg'))).toThrow(
      /must be a directory/
    )
  })

  it('creates the link and leaves an already-correct link alone', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-create-'))
    created.push(root)
    const targetDir = join(root, 'real')
    const linkPath = join(root, 'scope', 'pkg')
    mkdirSync(targetDir, { recursive: true })
    mkdirSync(join(root, 'scope'), { recursive: true })

    createSymlink(targetDir, linkPath)
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
    expect(existsSync(linkPath)).toBe(true)

    createSymlink(targetDir, linkPath)
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
  })

  it('replaces a mismatched link with the wanted target', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-create-'))
    created.push(root)
    const targetDir = join(root, 'real')
    const otherDir = join(root, 'other')
    const linkPath = join(root, 'scope', 'pkg')
    mkdirSync(targetDir, { recursive: true })
    mkdirSync(otherDir, { recursive: true })
    mkdirSync(join(root, 'scope'), { recursive: true })
    symlinkSync(otherDir, linkPath)

    createSymlink(targetDir, linkPath)
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
    expect(resolve(dirname(linkPath), readlinkSync(linkPath))).toBe(resolve(targetDir))
  })
})

describe('removeGeneratedLink', () => {
  it('removes a link pointing inside the out dir and returns true', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-unlink-'))
    created.push(root)
    const outDir = join(root, '.reference-ui')
    const linkPath = join(root, 'scope', 'pkg')
    mkdirSync(join(outDir, 'pkg'), { recursive: true })
    mkdirSync(join(root, 'scope'), { recursive: true })
    symlinkSync(join(outDir, 'pkg'), linkPath)

    expect(removeGeneratedLink(linkPath, outDir)).toBe(true)
    expect(existsSync(linkPath)).toBe(false)
  })

  it('removes a dangling generated link without probing existence', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-unlink-'))
    created.push(root)
    const outDir = join(root, '.reference-ui')
    const linkPath = join(root, 'scope', 'pkg')
    mkdirSync(join(root, 'scope'), { recursive: true })
    symlinkSync(join(outDir, 'pkg'), linkPath)

    expect(removeGeneratedLink(linkPath, outDir)).toBe(true)
    expect(() => lstatSync(linkPath)).toThrow()
  })

  it('keeps a real directory and returns false', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-unlink-'))
    created.push(root)
    const outDir = join(root, '.reference-ui')
    const linkPath = join(root, 'scope', 'pkg')
    mkdirSync(outDir, { recursive: true })
    mkdirSync(linkPath, { recursive: true })
    writeFileSync(join(linkPath, 'keep.mjs'), 'export {}\n', 'utf-8')

    expect(removeGeneratedLink(linkPath, outDir)).toBe(false)
    expect(existsSync(join(linkPath, 'keep.mjs'))).toBe(true)
  })

  it('keeps a regular file and returns false', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-unlink-'))
    created.push(root)
    const outDir = join(root, '.reference-ui')
    const linkPath = join(root, 'scope', 'pkg')
    mkdirSync(outDir, { recursive: true })
    mkdirSync(join(root, 'scope'), { recursive: true })
    writeFileSync(linkPath, 'hand-placed\n', 'utf-8')

    expect(removeGeneratedLink(linkPath, outDir)).toBe(false)
    expect(existsSync(linkPath)).toBe(true)
  })

  it('keeps a link pointing outside the out dir and returns false', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-unlink-'))
    created.push(root)
    const outDir = join(root, '.reference-ui')
    const elsewhere = join(root, 'elsewhere')
    const linkPath = join(root, 'scope', 'pkg')
    mkdirSync(outDir, { recursive: true })
    mkdirSync(elsewhere, { recursive: true })
    mkdirSync(join(root, 'scope'), { recursive: true })
    symlinkSync(elsewhere, linkPath)

    expect(removeGeneratedLink(linkPath, outDir)).toBe(false)
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
  })

  it('keeps a link under a sibling prefix of the out dir and returns false', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-unlink-'))
    created.push(root)
    const outDir = join(root, '.reference-ui')
    const sibling = join(root, '.reference-ui-sibling')
    const linkPath = join(root, 'scope', 'pkg')
    mkdirSync(sibling, { recursive: true })
    mkdirSync(join(root, 'scope'), { recursive: true })
    symlinkSync(sibling, linkPath)

    expect(removeGeneratedLink(linkPath, outDir)).toBe(false)
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
  })

  it('returns false for a missing path', () => {
    const root = mkdtempSync(join(tmpdir(), 'ref-unlink-'))
    created.push(root)
    const outDir = join(root, '.reference-ui')
    mkdirSync(outDir, { recursive: true })

    expect(removeGeneratedLink(join(root, 'scope', 'pkg'), outDir)).toBe(false)
  })
})
