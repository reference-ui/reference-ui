import { lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { pruneBrokenSymlinksInDir } from './index'

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
