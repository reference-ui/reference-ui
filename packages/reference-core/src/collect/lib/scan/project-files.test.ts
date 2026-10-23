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

  it('ends a loop of self-linked directories once each directory and glob state is walked', () => {
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

describe('listProjectFiles reaches a nested link under an alias that admits none of the target', () => {
  it('lists a file reached only through a link nested in a target that an earlier alias also reaches', () => {
    const root = tempRoot()
    const outside = tempRoot()
    writeFiles(outside, { 't/d.ts': 'export const d = 1\n', 'u/x.ts': 'export const x = 1\n', 'u/y.ts': 'export const y = 2\n' })
    symlinkSync(join(outside, 'u'), join(outside, 't', 'n'))
    mkdirSync(join(root, 'src', 'a'), { recursive: true })
    mkdirSync(join(root, 'src', 'b'), { recursive: true })
    symlinkSync(join(outside, 't'), join(root, 'src', 'a', 't'))
    symlinkSync(join(outside, 't'), join(root, 'src', 'b', 't'))
    expect(listProjectFiles(root, ['src/a/t/n/x.ts', 'src/b/t/n/y.ts'], ROOT_IGNORE)).toEqual([
      join(root, 'src', 'a', 't', 'n', 'x.ts'),
      join(root, 'src', 'b', 't', 'n', 'y.ts'),
    ])
  })
})

// Eight directories, each linked to the next two and back to the one before, so every state repeats; only n0 holds a file.
function linkLattice(root: string, size: number): void {
  for (let index = 1; index < size; index++) mkdirSync(join(root, 'src', `n${index}`), { recursive: true })
  for (let index = 0; index < size; index++) {
    const dir = join(root, 'src', `n${index}`)
    if (index + 1 < size) symlinkSync(join('..', `n${index + 1}`), join(dir, 'next1'))
    if (index + 2 < size) symlinkSync(join('..', `n${index + 2}`), join(dir, 'next2'))
    if (index >= 1) symlinkSync(join('..', `n${index - 1}`), join(dir, 'back'))
  }
}

// Listing shapes of the alias-aware walk under a glob include: each (directory, glob state) is walked once, so a loop
// or a link lattice ends, and a file a loop reaches through the link that closes it is listed under that link's path.
describe('listProjectFiles under an include walks each (directory, glob state) once', () => {
  it('lists a file a loop reaches only through the link that closes it, after the real files', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/x.ts': 'export const x = 1\n', 'src/a/y.ts': 'export const y = 1\n' })
    symlinkSync('..', join(root, 'src', 'a', 'up'))
    expect(listProjectFiles(root, ['src/a/**/*.ts'], ROOT_IGNORE)).toEqual([
      join(root, 'src', 'a', 'y.ts'),
      join(root, 'src', 'a', 'up', 'x.ts'),
    ])
  })

  it('lists each file of a five-directory link clique once, under its real path', () => {
    const root = tempRoot()
    const names = ['d0', 'd1', 'd2', 'd3', 'd4']
    writeFiles(root, Object.fromEntries(names.map((name) => [`src/${name}/f.ts`, 'export const f = 1\n'])))
    for (const from of names) {
      for (const to of names) if (from !== to) symlinkSync(join('..', to), join(root, 'src', from, `to-${to}`))
    }
    expect(listProjectFiles(root, SRC_INCLUDE, ROOT_IGNORE)).toEqual(names.map((name) => join(root, 'src', name, 'f.ts')))
  })

  it('walks a seven-directory link clique in under five seconds, listing each file once under its real path', () => {
    const root = tempRoot()
    const names = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6']
    writeFiles(root, Object.fromEntries(names.map((name) => [`src/${name}/f.ts`, 'export const f = 1\n'])))
    for (const from of names) {
      for (const to of names) if (from !== to) symlinkSync(join('..', to), join(root, 'src', from, `to-${to}`))
    }
    const started = Date.now()
    const listed = listProjectFiles(root, SRC_INCLUDE, ROOT_IGNORE)
    expect(Date.now() - started).toBeLessThan(5000)
    expect(listed).toEqual(names.map((name) => join(root, 'src', name, 'f.ts')))
  })

  it('lists the one file of an eight-directory link lattice, under its real path', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/n0/x.ts': 'export const x = 1\n' })
    linkLattice(root, 8)
    expect(listProjectFiles(root, SRC_INCLUDE, ROOT_IGNORE)).toEqual([join(root, 'src', 'n0', 'x.ts')])
  })

  it('cuts a real directory beneath a link whose (directory, glob state) pair was already walked', () => {
    const root = tempRoot()
    writeFiles(root, { 'lib/a.ts': 'export const a = 1\n' })
    mkdirSync(join(root, 'src', 'c'), { recursive: true })
    symlinkSync('..', join(root, 'src', 'c', 'l2'))
    symlinkSync(join('..', '..', 'lib'), join(root, 'src', 'c', 'l5'))
    expect(listProjectFiles(root, ['src/**/*.ts', '!src/zz/**'], ROOT_IGNORE)).toEqual([join(root, 'src', 'c', 'l5', 'a.ts')])
  })
})

describe('listProjectFiles under an include: brace, negation and fallback shapes', () => {
  it('lists the file under a link to an ignored directory, as the wave-2 walk does', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/a/f.ts': 'export const f = 1\n' })
    symlinkSync('a', join(root, 'src', 'b'))
    expect(listProjectFiles(root, ['src/**/*.ts', '!src/a/**'], ROOT_IGNORE)).toEqual([join(root, 'src', 'b', 'f.ts')])
  })

  it('lists each alternative of a brace include, and a file of a shared target once', () => {
    const root = tempRoot()
    writeFiles(root, {
      'src/a/x.ts': 'export const x = 1\n',
      'src/b/q/x.ts': 'export const x = 2\n',
      'src/c/x.ts': 'export const x = 3\n',
    })
    symlinkSync(join('..', 'a'), join(root, 'src', 'b', 'up'))
    expect(listProjectFiles(root, ['src/{a,b}/**/x.ts'], ROOT_IGNORE)).toEqual([
      join(root, 'src', 'a', 'x.ts'),
      join(root, 'src', 'b', 'q', 'x.ts'),
    ])
  })

  it('walks a self-link that changes the glob state, and lists the file it reaches under that link', () => {
    const root = tempRoot()
    writeFiles(root, { 'x/a/k.ts': 'export const k = 1\n' })
    symlinkSync('.', join(root, 'x', 'a', 'a'))
    expect(listProjectFiles(root, ['**/a/a/*.ts'], ROOT_IGNORE)).toEqual([join(root, 'x', 'a', 'a', 'k.ts')])
  })

  it('drops only the directory and the link a bare negation names, and walks beneath both', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/b/y.ts': 'export const y = 1\n', 'lib/x.ts': 'export const x = 1\n' })
    symlinkSync(join('..', 'lib'), join(root, 'src', 'l0'))
    expect(listProjectFiles(root, ['src/**/*.ts', '!src/b', '!src/l0'], ROOT_IGNORE)).toEqual([
      join(root, 'src', 'b', 'y.ts'),
      join(root, 'src', 'l0', 'x.ts'),
    ])
  })

  it('drops the files a one-level negation matches and walks the directories it matches', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/b/y.ts': 'export const y = 1\n', 'src/b/sub/z.ts': 'export const z = 1\n' })
    expect(listProjectFiles(root, ['src/**/*.ts', '!src/b/*'], ROOT_IGNORE)).toEqual([join(root, 'src', 'b', 'sub', 'z.ts')])
  })

  it('prunes only the brace alternative of a negation that ends in /**', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/a/x.ts': 'export const x = 1\n', 'src/b/y.ts': 'export const y = 1\n' })
    expect(listProjectFiles(root, ['src/**/*.ts', '!{src/a/**,src/b}'], ROOT_IGNORE)).toEqual([join(root, 'src', 'b', 'y.ts')])
  })

  it('keeps the loop cut for an include the glob model does not cover', () => {
    const root = tempRoot()
    writeFiles(root, { 'src/x.ts': 'export const x = 1\n', 'src/a/y.ts': 'export const y = 1\n' })
    symlinkSync('..', join(root, 'src', 'a', 'up'))
    expect(listProjectFiles(root, ['src/(a|b)/**/*.ts'], ROOT_IGNORE)).toEqual([join(root, 'src', 'a', 'y.ts')])
  })
})

