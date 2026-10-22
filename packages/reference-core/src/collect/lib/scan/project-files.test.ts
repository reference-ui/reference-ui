// Unit tests for the project file listing under the native walk's symlink rule. Each test builds a temp tree with real
// symlinks, lists it through listProjectFiles and planProjectWalk, and compares the exact paths. The trees mirror the Rust
// unit tests in atomic's sources/tests/disk.rs, so both sides pin the same expectations.
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { NATIVE_IGNORE_DIRS } from '../../constants.ts'
import { listProjectFiles, planProjectWalk } from './project-files.ts'

// The Rust walk's engine-ignored directory names: the list the JS walk must prune the same way.
const RUST_WALK = new URL('../../../../../reference-rs/modules/atomic/src/sources/walk.rs', import.meta.url)

const SRC_INCLUDE = ['src/**/*.ts']
const ROOT_IGNORE = ['**/node_modules/**']
const roots: string[] = []

function tempRoot(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'project-files-')))
  roots.push(root)
  return root
}

function writeFiles(root: string, files: Record<string, string>): void {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), content)
  }
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('listProjectFiles', () => {
  it('lists a file reached through a linked sibling in scope once, under its real path', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/a/x.ts': 'export const x = 1\n' })
    symlinkSync(join(root, 'src', 'a'), join(root, 'src', 'b'))
    expect(listProjectFiles(root, SRC_INCLUDE, ROOT_IGNORE)).toEqual([join(root, 'src', 'a', 'x.ts')])
  })

  it('lists a linked sibling outside the include scope through its link, once', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/app.ts': 'export const a = 1\n', 'lib/colors.ts': 'export const c = 2\n' })
    symlinkSync(join('..', 'lib'), join(root, 'src', 'palette'))
    expect(listProjectFiles(root, SRC_INCLUDE, ROOT_IGNORE)).toEqual([
      join(root, 'src', 'app.ts'),
      join(root, 'src', 'palette', 'colors.ts'),
    ])
  })

  it('ends a loop of self-linked directories at the link that closes it', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/app.ts': 'export const a = 1\n' })
    symlinkSync('.', join(root, 'src', 'loopA'))
    symlinkSync('.', join(root, 'src', 'loopB'))
    expect(listProjectFiles(root, SRC_INCLUDE, ROOT_IGNORE)).toEqual([join(root, 'src', 'app.ts')])
  })

  it('lists the files of two links to one outside directory once, under the first link', () => {
    const root = tempRoot()
    const outside = tempRoot()
    writeFiles(root, { 'src/keep.ts': 'export const k = 1\n' })
    writeFiles(outside, { 'x.ts': 'export const x = 1\n' })
    symlinkSync(outside, join(root, 'src', 'one'))
    symlinkSync(outside, join(root, 'src', 'two'))
    expect(listProjectFiles(root, SRC_INCLUDE, ROOT_IGNORE)).toEqual([
      join(root, 'src', 'keep.ts'),
      join(root, 'src', 'one', 'x.ts'),
    ])
  })

  it('never plans a link inside an ignored directory, so the ignore set prunes it as fast-glob does', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/app.ts': 'export const a = 1\n', 'node_modules/pkg/x.ts': 'export const x = 1\n' })
    symlinkSync('..', join(root, 'node_modules', 'pkg', 'up'))
    const plan = planProjectWalk(root, ROOT_IGNORE)
    expect(plan.refused).toEqual([])
    expect(listProjectFiles(root, ['**/*.ts'], ROOT_IGNORE)).toEqual([join(root, 'src', 'app.ts')])
  })
})

describe('planProjectWalk', () => {
  it('records the links it enters and the links it refuses', () => {
    const root = tempRoot()
    writeFiles(root, { 'lib/colors.ts': 'export const c = 2\n', 'src/app.ts': 'export const a = 1\n' })
    symlinkSync(join('..', 'lib'), join(root, 'src', 'palette'))
    symlinkSync('.', join(root, 'src', 'loopA'))
    const plan = planProjectWalk(root, ROOT_IGNORE)
    expect([...plan.links.entries()]).toEqual([[join(root, 'src', 'palette'), join(root, 'lib')]])
    expect(plan.refused).toEqual([join(root, 'src', 'loopA')])
  })
})

describe('listProjectFiles scope and engine-ignored directories', () => {
  it('lets an in-scope link list a target that an out-of-scope link reaches first', () => {
    const root = tempRoot()
    const outside = tempRoot()
    writeFiles(root, { 'src/app.ts': 'export const a = 1\n', 'lib/keep.ts': 'export const k = 1\n' })
    writeFiles(outside, { 'x.ts': 'export const x = 1\n' })
    symlinkSync(outside, join(root, 'lib', 'shared'))
    symlinkSync(outside, join(root, 'src', 'shared'))
    expect(listProjectFiles(root, SRC_INCLUDE, ROOT_IGNORE)).toEqual([
      join(root, 'src', 'app.ts'),
      join(root, 'src', 'shared', 'x.ts'),
    ])
  })

  it('lists each file of a target once, under the in-scope link that admits it', () => {
    const root = tempRoot()
    const outside = tempRoot()
    writeFiles(outside, { 'x.ts': 'export const x = 1\n', 'y.ts': 'export const y = 2\n' })
    writeFiles(root, { 'src/a/keep.ts': 'export const k = 1\n' })
    mkdirSync(join(root, 'src', 'b'), { recursive: true })
    symlinkSync(outside, join(root, 'src', 'a', 'shared'))
    symlinkSync(outside, join(root, 'src', 'b', 'shared'))
    expect(listProjectFiles(root, ['src/a/**/x.ts', 'src/b/**/y.ts'], ROOT_IGNORE)).toEqual([
      join(root, 'src', 'a', 'shared', 'x.ts'),
      join(root, 'src', 'b', 'shared', 'y.ts'),
    ])
  })

  it('does not admit a link under an engine-ignored directory, as the Rust walk never enters one', () => {
    const root = tempRoot()
    const outside = tempRoot()
    writeFiles(root, { 'src/app.ts': 'export const a = 1\n' })
    writeFiles(outside, { 'x.ts': 'export const x = 1\n' })
    mkdirSync(join(root, 'dist'), { recursive: true })
    symlinkSync(outside, join(root, 'dist', 'alias'))
    symlinkSync(outside, join(root, 'src', 'alias'))
    expect(listProjectFiles(root, ['**/*.ts'], ROOT_IGNORE)).toEqual([
      join(root, 'src', 'app.ts'),
      join(root, 'src', 'alias', 'x.ts'),
    ])
  })

  it('lists a file of an engine-ignored directory last, under a link that reaches it', () => {
    const root = tempRoot()
    writeFiles(root, { 'dist/x.ts': 'export const x = 1\n' })
    mkdirSync(join(root, 'src'), { recursive: true })
    symlinkSync(join('..', 'dist'), join(root, 'src', 'alias'))
    expect(listProjectFiles(root, ['**/*.ts'], ROOT_IGNORE)).toEqual([join(root, 'src', 'alias', 'x.ts')])
  })

  it('keeps the engine-ignored directory list in step with the Rust walk', () => {
    const walk = readFileSync(RUST_WALK, 'utf8')
    const block = /const IGNORE_DIRS: &\[&str\] = &\[([^\]]*)\]/.exec(walk)
    expect(block, 'IGNORE_DIRS in walk.rs').not.toBeNull()
    const rustNames = [...(block?.[1] ?? '').matchAll(/"([^"]+)"/g)].map((match) => match[1] ?? '')
    expect([...NATIVE_IGNORE_DIRS].sort()).toEqual([...rustNames].sort())
  })
})

