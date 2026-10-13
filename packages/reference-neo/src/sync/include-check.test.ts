// Include check legs: a glob that reaches no file yields one warning naming each
// dead positive pattern, a glob that reaches a file stays silent, and negations
// never count. Each leg runs over a temp project with one token file under theme/.

import { mkdirSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { includeMatchDiagnostics } from './include-check.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function projectWithTokens(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-include-check-'))
  tempDirs.push(dir)
  mkdirSync(join(dir, 'theme'), { recursive: true })
  writeFileSync(join(dir, 'theme', 'tokens.ts'), "export const x = 1\n")
  return dir
}

describe('includeMatchDiagnostics', () => {
  it('stays silent when every include reaches a file', async () => {
    const dir = await projectWithTokens()
    expect(includeMatchDiagnostics(dir, ['theme/**/*.{ts,tsx}'])).toEqual([])
  })

  it('warns once, naming only the dead positive patterns', async () => {
    const dir = await projectWithTokens()
    const diagnostics = includeMatchDiagnostics(dir, ['nothing/**/*.ts', 'theme/**/*.ts', '!theme/skip.ts'])
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.severity).toBe('warning')
    expect(diagnostics[0]?.message).toContain("'nothing/**/*.ts'")
    expect(diagnostics[0]?.message).not.toContain("'theme/**/*.ts'")
    expect(diagnostics[0]?.message).toContain('matched no files')
  })

  it('reads a single dead include as one pattern, and points at the config to fix', async () => {
    const dir = await projectWithTokens()
    const [only] = includeMatchDiagnostics(dir, ['nothing/**/*.ts'])
    expect(only?.message).toContain("'nothing/**/*.ts'")
    expect(only?.message).toContain('Fragments and tokens under it are not scanned')
    expect(only?.help?.[0]).toContain('config')
  })
})
