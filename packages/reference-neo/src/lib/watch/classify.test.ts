// Unit tests for watch event classification over a temp tree, with synthetic
// parcel events against a live match snapshot. They pin which events become
// changes: direct matches, config dependency files, symlink targets reported under
// their link, directories that move matches in or out of scope, and the paths
// that never do (unmatched files, engine-ignored directories, outside the root).

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { Event as ParcelEvent } from '@parcel/watcher'
import { afterEach, describe, expect, it } from 'vitest'
import { classifyEvent, type ClassifyState } from './classify.ts'
import { canonicalPath, createIncludeMatcher, scanMatches } from './match.ts'

const INCLUDE = ['theme/**/*.{ts,tsx}']
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function makeTree(files: Record<string, string>): string {
  const dir = canonicalPath(mkdtempSync(join(tmpdir(), 'neo-watch-classify-')))
  tempDirs.push(dir)
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), body)
  }
  return dir
}

// The state a watch holds after one baseline scan of the tree.
function stateOf(root: string, dependencyFiles: string[] = []): ClassifyState {
  return {
    watchRoot: root,
    isMatch: createIncludeMatcher(INCLUDE),
    dependencyFiles: new Set(dependencyFiles),
    snapshot: scanMatches(root, INCLUDE),
  }
}

function event(type: ParcelEvent['type'], path: string): ParcelEvent {
  return { type, path }
}

describe('classifyEvent', () => {
  it('reports a matched file under its relative path with the parcel noun', () => {
    const root = makeTree({ 'theme/base.ts': 'b' })
    const state = stateOf(root)
    expect(classifyEvent(event('create', join(root, 'theme', 'late.ts')), state)).toEqual({
      event: 'add',
      path: join(root, 'theme', 'late.ts'),
      relativePath: 'theme/late.ts',
    })
    expect(classifyEvent(event('update', join(root, 'theme', 'base.ts')), state)?.event).toBe('change')
    expect(classifyEvent(event('delete', join(root, 'theme', 'base.ts')), state)?.event).toBe('unlink')
  })

  it('ignores an unmatched file', () => {
    const root = makeTree({ 'theme/base.ts': 'b', 'notes.md': 'n' })
    expect(classifyEvent(event('update', join(root, 'notes.md')), stateOf(root))).toBeNull()
  })

  it('reports a config dependency file even when include does not match it', () => {
    const root = makeTree({ 'theme/base.ts': 'b', 'ui.config.ts': 'c' })
    const config = join(root, 'ui.config.ts')
    const change = classifyEvent(event('update', config), stateOf(root, [config]))
    expect(change).toEqual({ event: 'change', path: config, relativePath: 'ui.config.ts' })
  })

  it('reports a symlink target edit under the relative path of its link', () => {
    const root = makeTree({ 'shared/colors.ts': 'c', 'theme/base.ts': 'b' })
    symlinkSync('../shared/colors.ts', join(root, 'theme', 'linked.ts'))
    const target = join(root, 'shared', 'colors.ts')
    expect(classifyEvent(event('update', target), stateOf(root))).toEqual({
      event: 'change',
      path: join(root, 'theme', 'linked.ts'),
      relativePath: 'theme/linked.ts',
    })
  })

  it('resyncs on the delete of a directory the last snapshot held matches under', () => {
    const root = makeTree({ 'theme/box/a.ts': 'a' })
    expect(classifyEvent(event('delete', join(root, 'theme', 'box')), stateOf(root))).toEqual({
      event: 'unlink',
      path: join(root, 'theme', 'box'),
      relativePath: 'theme/box',
    })
  })

  it('ignores the delete of a directory that held no matches', () => {
    const root = makeTree({ 'theme/base.ts': 'b', 'theme/empty/readme.md': 'r' })
    expect(classifyEvent(event('delete', join(root, 'theme', 'empty')), stateOf(root))).toBeNull()
  })

  it('resyncs when a directory moves in holding a match', () => {
    // The snapshot predates the move, so only the subtree probe can see the match.
    const root = makeTree({ 'theme/base.ts': 'b' })
    const state = stateOf(root)
    mkdirSync(join(root, 'theme', 'box'))
    writeFileSync(join(root, 'theme', 'box', 'a.ts'), 'a')
    expect(classifyEvent(event('create', join(root, 'theme', 'box')), state)).toEqual({
      event: 'add',
      path: join(root, 'theme', 'box'),
      relativePath: 'theme/box',
    })
  })

  it('ignores a directory that moves in holding no match', () => {
    const root = makeTree({ 'theme/base.ts': 'b', 'theme/docs/readme.md': 'r' })
    expect(classifyEvent(event('create', join(root, 'theme', 'docs')), stateOf(root))).toBeNull()
  })

  it('never reports an engine-ignored directory', () => {
    const root = makeTree({ 'theme/base.ts': 'b', 'theme/dist/a.ts': 'a' })
    expect(classifyEvent(event('create', join(root, 'theme', 'dist')), stateOf(root))).toBeNull()
  })

  it('never reports a path outside the watch root', () => {
    const root = makeTree({ 'theme/base.ts': 'b' })
    expect(classifyEvent(event('create', join(dirname(root), 'elsewhere.ts')), stateOf(root))).toBeNull()
  })
})
