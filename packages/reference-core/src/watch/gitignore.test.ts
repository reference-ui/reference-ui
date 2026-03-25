import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { getWatchIgnoreGlobs, toWatcherIgnoreGlobs } from './gitignore'

function createTempWorkspace(): string {
  return mkdtempSync(join(tmpdir(), 'reference-watch-gitignore-'))
}

describe('watch/gitignore', () => {
  const rootsToDelete: string[] = []

  afterEach(async () => {
    const { rm } = await import('node:fs/promises')
    await Promise.all(rootsToDelete.splice(0).map((root) => rm(root, { recursive: true, force: true })))
  })

  it('converts anchored gitignore entries relative to the watch root', () => {
    const watchRoot = '/workspace/src'
    const gitignoreDir = '/workspace'

    expect(toWatcherIgnoreGlobs('/src/generated/', watchRoot, gitignoreDir)).toEqual(['generated/**'])
    expect(toWatcherIgnoreGlobs('/src/generated/file.ts', watchRoot, gitignoreDir)).toEqual([
      'generated/file.ts',
      'generated/file.ts/**',
    ])
  })

  it('ignores comments, blank lines, and negated patterns', () => {
    expect(toWatcherIgnoreGlobs('', '/workspace', '/workspace')).toEqual([])
    expect(toWatcherIgnoreGlobs('# comment', '/workspace', '/workspace')).toEqual([])
    expect(toWatcherIgnoreGlobs('!keep-me.ts', '/workspace', '/workspace')).toEqual([])
  })

  it('includes static watcher ignores and ancestor gitignore patterns', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, '.git'))
    mkdirSync(join(workspace, 'src', 'generated'), { recursive: true })
    writeFileSync(
      join(workspace, '.gitignore'),
      ['dist/', '.reference-ui', '/src/generated/', '!src/generated/keep.ts'].join('\n'),
      'utf-8',
    )

    const ignores = getWatchIgnoreGlobs(join(workspace, 'src'))

    expect(ignores).toEqual(
      expect.arrayContaining([
        '**/node_modules/**',
        '**/.reference-ui/**',
        '**/.git/**',
        '**/dist/**',
        '**/.reference-ui',
        '**/.reference-ui/**',
        'generated/**',
      ]),
    )
    expect(ignores).not.toContain('keep.ts')
  })

  it('includes nested gitignore patterns while walking to the repo root', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, '.git'))
    mkdirSync(join(workspace, 'packages', 'app', 'src', 'cache'), { recursive: true })
    writeFileSync(join(workspace, '.gitignore'), 'dist/\n', 'utf-8')
    writeFileSync(join(workspace, 'packages', 'app', '.gitignore'), 'src/cache/\n', 'utf-8')

    const ignores = getWatchIgnoreGlobs(join(workspace, 'packages', 'app', 'src'))

    expect(ignores).toEqual(expect.arrayContaining(['**/dist/**', 'cache/**']))
  })
})
