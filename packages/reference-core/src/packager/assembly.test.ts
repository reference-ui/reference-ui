// Unit tests for the assembly's synced role lookup.
// They take a live out dir under a temp project root and assert that the role
// comes from the project root, the out dir's parent, as publisher, consumer, or none.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { syncedRoleFor } from './assembly.ts'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function makeProject(name: string): string {
  const root = mkdtempSync(join(tmpdir(), 'neo-assembly-role-'))
  tempDirs.push(root)
  const project = join(root, name)
  mkdirSync(join(project, '.reference-ui'), { recursive: true })
  return project
}

describe('syncedRoleFor', () => {
  it('reads the project root as the parent of the live out dir', () => {
    const project = makeProject('app')
    writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@reference-ui/lib' }))
    expect(syncedRoleFor(join(project, '.reference-ui'))).toBe('publisher')
  })

  it('is a consumer when the project root sees an installed lib', () => {
    const project = makeProject('app')
    writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'app' }))
    mkdirSync(join(project, 'node_modules', '@reference-ui', 'lib'), { recursive: true })
    expect(syncedRoleFor(join(project, '.reference-ui'))).toBe('consumer')
  })

  it('is none for a project with no lib name and no lib above it', () => {
    const project = makeProject('app')
    writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'app' }))
    expect(syncedRoleFor(join(project, '.reference-ui'))).toBe('none')
  })
})
