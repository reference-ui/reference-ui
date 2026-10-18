// Unit tests for the synced role detector.
// They build small project trees in a temp dir and assert publisher, consumer,
// and none: the publisher name check, the walk up to a hoisted lib, the
// publisher-first order, and the loud failure on a malformed package.json.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { detectSyncedRole } from './synced-role.ts'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function makeRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'neo-synced-role-'))
  tempDirs.push(dir)
  return dir
}

function writePackageNamed(dir: string, name: string): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version: '0.0.0' }))
}

function installLib(root: string): void {
  mkdirSync(join(root, 'node_modules', '@reference-ui', 'lib'), { recursive: true })
}

describe('detectSyncedRole', () => {
  it('is the publisher when the root package.json names @reference-ui/lib', () => {
    const root = makeRoot()
    writePackageNamed(root, '@reference-ui/lib')
    expect(detectSyncedRole(root)).toBe('publisher')
  })

  it('stays the publisher when a lib is installed too, so lib never augments its own register', () => {
    const root = makeRoot()
    writePackageNamed(root, '@reference-ui/lib')
    installLib(root)
    expect(detectSyncedRole(root)).toBe('publisher')
  })

  it('is a consumer when node_modules/@reference-ui/lib exists at the project root', () => {
    const root = makeRoot()
    writePackageNamed(root, 'app')
    installLib(root)
    expect(detectSyncedRole(root)).toBe('consumer')
  })

  it('walks up from a nested project to a hoisted lib', () => {
    const root = makeRoot()
    installLib(root)
    const nested = join(root, 'apps', 'web')
    writePackageNamed(nested, 'web')
    expect(detectSyncedRole(nested)).toBe('consumer')
  })

  it('is none when no lib is installed at or above the root', () => {
    const root = makeRoot()
    writePackageNamed(root, 'app')
    expect(detectSyncedRole(root)).toBe('none')
  })

  it('is none for a project with no package.json', () => {
    const root = makeRoot()
    mkdirSync(root, { recursive: true })
    expect(detectSyncedRole(root)).toBe('none')
  })

  it('is none for a package.json without a name or with another package name', () => {
    const unnamed = makeRoot()
    mkdirSync(unnamed, { recursive: true })
    writeFileSync(join(unnamed, 'package.json'), JSON.stringify({ version: '1.0.0' }))
    expect(detectSyncedRole(unnamed)).toBe('none')

    const react = makeRoot()
    writePackageNamed(react, '@reference-ui/react')
    expect(detectSyncedRole(react)).toBe('none')
  })

  it('throws naming the package.json when it is not valid JSON', () => {
    const root = makeRoot()
    mkdirSync(root, { recursive: true })
    writeFileSync(join(root, 'package.json'), '{ "name": ')
    expect(() => detectSyncedRole(root)).toThrow(/package\.json is not readable JSON/)
  })
})
