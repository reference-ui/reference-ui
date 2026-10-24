/**
 * Tests that buildTasty refuses an include glob past the brace limits.
 * An include whose braces expand past 1,024 globs or nest past 64 levels reaches the native scan, which fails with
 * the stable TST-E-SCAN-FAILED code naming the glob and the limit, instead of expanding it.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildTasty } from './build.js'

async function refusalFor(include: string[]): Promise<string> {
  const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-brace-limits-'))
  const rootDir = join(tempRoot, 'workspace')
  try {
    await mkdir(join(rootDir, 'src'), { recursive: true })
    await writeFile(join(rootDir, 'src', 'a.ts'), 'export interface A {\n  a: string\n}\n', 'utf-8')
    await buildTasty({ rootDir, include, outputDir: join(tempRoot, 'tasty-output') })
    return ''
  } catch (error) {
    return String((error as Error).message)
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
}

describe('buildTasty include brace limits', () => {
  it('refuses a glob that expands past 1,024 globs, naming it', async () => {
    const glob = `src/${'{a,b}'.repeat(24)}.ts`
    const message = await refusalFor([glob])
    expect(message).toContain(
      `TST-E-SCAN-FAILED: invalid include glob '${glob}': braces expand to more than 1,024 globs`
    )
  })

  it('refuses a glob that nests past 64 levels', async () => {
    const glob = `src/${'{a,'.repeat(65)}b${'}'.repeat(65)}.ts`
    const message = await refusalFor([glob])
    expect(message).toContain(
      `TST-E-SCAN-FAILED: invalid include glob '${glob}': braces nest deeper than 64 levels`
    )
  })

  it('builds a glob exactly at the expansion limit', async () => {
    expect(await refusalFor([`src/**/*.ts${'{a,b}'.repeat(10)}`])).toBe('')
  })
})
