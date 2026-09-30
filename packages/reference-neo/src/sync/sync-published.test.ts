// Sync published-folder proofs over temp projects with the native compiler.
// They take fixture configs plus author files and assert the published tree
// plus byte-identical folders across consecutive syncs. Every run compiles
// for real: no stubs stand between sync and the engine.

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanDir } from './clean.ts'
import { sync } from './index.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => cleanDir(dir)))
})

async function writeProject(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-sync-'))
  tempDirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content)
  }
  return dir
}

function configFile(extra: string): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    '',
    'export default defineConfig({',
    "  name: 'sync-test',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    extra,
    '})',
    '',
  ].join('\n')
}

const TOKENS_FILE = [
  "import { tokens } from '@reference-ui/neo'",
  '',
  'tokens({',
  '  colors: {',
  "    brand: { value: '#7c3aed' },",
  '  },',
  '})',
  '',
].join('\n')

function outFile(dir: string, ...parts: string[]): string {
  return join(dir, '.reference-ui', ...parts)
}

function snapshotFolder(outDir: string): string[] {
  const files: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      // The tasty dir is session-owned background output, not sync's
      // publish: it lands after sync returns and persists across syncs, so
      // determinism snapshots the committed folder without it.
      if (relative(outDir, full) === join('types', 'tasty')) continue
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile()) files.push(full)
    }
  }
  walk(outDir)
  files.sort()
  return files.map(file => {
    const digest = createHash('sha256').update(readFileSync(file)).digest('hex')
    return `${relative(outDir, file)}:${digest}`
  })
}

describe('sync published folder', () => {
  it('publishes system, styled, and react from one token', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile("  jsxElements: ['CardFrame'],"),
      'theme/tokens.ts': TOKENS_FILE,
    })

    const { outDir, spec } = await sync(dir)

    expect(outDir).toBe(join(dir, '.reference-ui'))
    expect(spec.name).toBe('sync-test')
    for (const file of [
      'system/baseSystem.mjs',
      'system/baseSystem.d.mts',
      'system/evaluated-system.json',
      'system/jsx-elements.json',
      'system/package.json',
      'styled/styles.css',
      'styled/package.json',
      'react/package.json',
    ]) {
      expect(existsSync(outFile(dir, file))).toBe(true)
    }

    // D2: the styled dir carries no global.css; global rules live in styles.css.
    expect(existsSync(outFile(dir, 'styled/global.css'))).toBe(false)

    // Note d: no eval droppings survive under tmp/ — empty or gone entirely.
    const tmpDir = outFile(dir, 'tmp')
    const tmpEntries = existsSync(tmpDir) ? readdirSync(tmpDir) : []
    expect(tmpEntries).toEqual([])

    const styles = readFileSync(outFile(dir, 'styled/styles.css'), 'utf-8')
    expect(styles).toContain('@layer sync-test')
    expect(styles).toContain('--colors-brand: #7c3aed')

    const generated = [...readFileSync(outFile(dir, 'react', 'react.d.mts'), 'utf-8').matchAll(/export declare const (\w+): \(props: \w+Props/g)].map(match => match[1] as string)
    const jsx = JSON.parse(readFileSync(outFile(dir, 'system/jsx-elements.json'), 'utf-8')) as {
      primitives: string[]
      local: string[]
      merged: string[]
    }
    expect(jsx.primitives).toEqual([...new Set(generated)].sort())
    expect(jsx.local).toEqual(['CardFrame'])
    expect(jsx.merged).toEqual(['CardFrame'])
  })

  it('cleans the stale folder first', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
      '.reference-ui/stale.txt': 'yesterday',
    })

    await sync(dir)

    expect(existsSync(outFile(dir, 'stale.txt'))).toBe(false)
    expect(existsSync(outFile(dir, 'styled/styles.css'))).toBe(true)
  })
})

describe('sync folder determinism', () => {
  it('produces byte-identical folders across consecutive syncs', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
      'theme/app.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        "export const cls = css({ color: 'brand' })",
        "export const hoverCls = css({ _hover: { color: 'brand' } })",
        '',
      ].join('\n'),
    })

    const { outDir } = await sync(dir)
    const first = snapshotFolder(outDir)
    expect(first.length).toBeGreaterThanOrEqual(10)

    await sync(dir)
    expect(snapshotFolder(outDir)).toEqual(first)
  })
})
