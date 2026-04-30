import { describe, it, expect, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isFragmentFile } from './detect'

const fixtureDir = join(import.meta.dirname, '__fixtures__-fragment-detect')

afterEach(() => {
  rmSync(fixtureDir, { recursive: true, force: true })
})

describe('isFragmentFile', () => {
  it('returns true for a file importing from @reference-ui/system', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    const file = join(fixtureDir, 'tokens.ts')
    writeFileSync(file, `import { tokens } from '@reference-ui/system'\ntokens({ colors: {} })`)
    expect(await isFragmentFile(file, 'change')).toBe(true)
  })

  it('returns true for @reference-ui/core/config import', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    const file = join(fixtureDir, 'core.ts')
    writeFileSync(file, `import { tokens } from '@reference-ui/core/config'\ntokens({})`)
    expect(await isFragmentFile(file, 'add')).toBe(true)
  })

  it('returns true for @reference-ui/cli/config import', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    const file = join(fixtureDir, 'cli.ts')
    writeFileSync(file, `import { tokens } from '@reference-ui/cli/config'\ntokens({})`)
    expect(await isFragmentFile(file, 'add')).toBe(true)
  })

  it('returns false for a file importing @reference-ui/react (not system API)', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    const file = join(fixtureDir, 'Component.tsx')
    writeFileSync(
      file,
      `import { Div } from '@reference-ui/react'\nexport default function C() { return <Div /> }`
    )
    expect(await isFragmentFile(file, 'change')).toBe(false)
  })

  it('returns false for a regular component with no reference-ui imports', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    const file = join(fixtureDir, 'Button.tsx')
    writeFileSync(file, `import React from 'react'\nexport function Button() { return <button /> }`)
    expect(await isFragmentFile(file, 'change')).toBe(false)
  })

  it('returns false for unlink events regardless of file content', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    const file = join(fixtureDir, 'tokens.ts')
    writeFileSync(file, `import { tokens } from '@reference-ui/system'\ntokens({})`)
    expect(await isFragmentFile(file, 'unlink')).toBe(false)
  })

  it('returns false for a non-existent file path', async () => {
    expect(await isFragmentFile(join(fixtureDir, 'missing.ts'), 'change')).toBe(false)
  })

  it('handles side-effect imports from @reference-ui/system', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    const file = join(fixtureDir, 'side-effect.ts')
    writeFileSync(file, `import '@reference-ui/system'`)
    expect(await isFragmentFile(file, 'change')).toBe(true)
  })
})