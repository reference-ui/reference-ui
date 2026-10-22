/**
 * Tests the declaration step end to end in a copy of this package. The copy holds the package's scripts and its TypeScript
 * and JSON sources outside the tests, so the real tsc and create-dts run against it. A source deleted between two builds
 * must take its declaration with it, and a declaration whose source is still there must survive both builds.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Dirent } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SKIPPED_DIRS = new Set(['tests', 'target', 'dist', 'node_modules', '.reference-ui'])
const COPIED_FILE = /\.(ts|tsx|mjs|json)$/
const copies: string[] = []

afterAll(() => {
  for (const dir of copies) fs.rmSync(dir, { recursive: true, force: true })
})

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}

function copyFileIfPresent(from: string, to: string): void {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  try {
    fs.copyFileSync(from, to)
  } catch (error) {
    // Another test or a checkout edit may remove a file while the copy runs; it is simply not copied then.
    if (!isMissing(error)) throw error
  }
}

/** Copies the sources under `rel`: directories except the test and build folders, and files of the kinds the build reads. */
function copyTree(fromRoot: string, toRoot: string, rel: string): void {
  for (const entry of listSources(path.join(fromRoot, rel))) {
    const child = path.join(rel, entry.name)
    if (entry.isDirectory()) {
      if (!isSkippedDir(entry.name)) copyTree(fromRoot, toRoot, child)
    } else if (isCopiedFile(entry)) {
      copyFileIfPresent(path.join(fromRoot, child), path.join(toRoot, child))
    }
  }
}

/** The entries of `dir`, or none when a concurrent edit has removed it. */
function listSources(dir: string): Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
  } catch (error) {
    if (isMissing(error)) return []
    throw error
  }
}

function isSkippedDir(name: string): boolean {
  return SKIPPED_DIRS.has(name) || name.startsWith('.')
}

function isCopiedFile(entry: Dirent): boolean {
  return entry.isFile() && COPIED_FILE.test(entry.name) && !entry.name.endsWith('.test.ts')
}

/**
 * A copy of this package for the declaration step. The root tsconfig is copied at the depth the package's relative
 * `extends` expects. node_modules is linked at both levels: TypeScript looks up @types/node from the package upward,
 * and the workspace keeps those packages at the repository root.
 */
function packageCopy(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'decl-copy-'))
  copies.push(root)
  fs.symlinkSync(path.resolve(PACKAGE_DIR, '../../node_modules'), path.join(root, 'node_modules'), 'dir')
  const pkg = path.join(root, 'packages', 'reference-rs')
  copyFileIfPresent(path.resolve(PACKAGE_DIR, '../../tsconfig.base.json'), path.join(root, 'tsconfig.base.json'))
  for (const file of ['package.json', 'tsconfig.json', 'tsconfig.build.json']) {
    copyFileIfPresent(path.join(PACKAGE_DIR, file), path.join(pkg, file))
  }
  for (const dir of ['scripts', 'modules', 'contracts']) copyTree(PACKAGE_DIR, pkg, dir)
  fs.symlinkSync(path.join(PACKAGE_DIR, 'node_modules'), path.join(pkg, 'node_modules'), 'dir')
  return pkg
}

/**
 * Runs the declaration step in the copy, as build:js does. It must exit 0 and say what it published: a step that finds
 * nothing to do exits 0 silently, so the report line is what shows it ran.
 */
function buildDeclarations(pkg: string): void {
  const run = spawnSync(process.execPath, [path.join(pkg, 'scripts', 'build-declarations.mjs')], {
    cwd: pkg,
    encoding: 'utf8',
  })
  expect(run.status, `build-declarations exits 0\n${run.stdout}\n${run.stderr}`).toBe(0)
  expect(run.stdout, 'the step reports what it published').toContain('build-declarations: published')
}

describe('the declaration step in a copy of the package', () => {
  it('removes the declaration of a source deleted between two builds, and keeps the declarations of the sources still there', () => {
    const pkg = packageCopy()
    const leafSource = path.join(pkg, 'modules/atlas/js/scratch-leaf.ts')
    const leafDeclaration = path.join(pkg, 'dist/modules/atlas/js/scratch-leaf.d.ts')
    fs.writeFileSync(leafSource, 'export const leaf = 1\n')
    buildDeclarations(pkg)
    expect(fs.existsSync(leafDeclaration)).toBe(true)

    fs.rmSync(leafSource)
    buildDeclarations(pkg)
    expect(fs.existsSync(leafDeclaration)).toBe(false)
    expect(fs.existsSync(path.join(pkg, 'dist/modules/atlas/js/index.d.ts'))).toBe(true)
    expect(fs.existsSync(path.join(pkg, 'dist/index.d.ts'))).toBe(true)
    expect(fs.readdirSync(pkg).filter(name => name.startsWith('dist.__'))).toEqual([])
  })
})
