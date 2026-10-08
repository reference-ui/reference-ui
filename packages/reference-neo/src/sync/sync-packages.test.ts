// Sync generated-package proofs over temp projects with the native compiler.
// They take fixture configs plus author files and assert the runtime leg,
// the importable base system, the node_modules links, and the loud
// missing-config failure. Every run compiles for real: no stubs stand
// between sync and the engine.

import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { ConfigNotFoundError } from '../config/errors.ts'
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

describe('sync runtime leg', () => {
  it('emits namer tables for source wants with a pre-registered css bundle', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
      'theme/app.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        "export const cls = css({ color: 'brand' })",
        '',
      ].join('\n'),
    })

    await sync(dir)

    const styles = readFileSync(outFile(dir, 'styled/styles.css'), 'utf-8')
    expect(styles).toContain('sync-test__c_brand')

    const mod = (await import(pathToFileURL(outFile(dir, 'react/react.mjs')).href)) as {
      css: (styles: Record<string, unknown>) => string
    }
    expect(typeof mod.css).toBe('function')
    expect(mod.css({ color: 'brand' })).toBe('sync-test__c_brand')
    expect(mod.css({ color: 'missing' })).toBe('sync-test__c_missing')
  })
})

describe('sync generated packages', () => {
  it('emits an importable base system carrying the portable bundle', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
    })

    await sync(dir)

    const mod = (await import(pathToFileURL(outFile(dir, 'system/baseSystem.mjs')).href)) as {
      baseSystem: {
        name: string
        fragment: string
        streams: Array<Record<string, unknown>>
        jsxElements: string[]
      } & Record<string, unknown>
    }
    expect(mod.baseSystem.name).toBe('sync-test')
    expect(typeof mod.baseSystem.fragment).toBe('string')
    expect(mod.baseSystem.fragment).toContain('brand')
    // S5 carriage: own-entry-only payload here; `css` stays dead forever.
    expect('css' in mod.baseSystem).toBe(false)
    expect(mod.baseSystem.streams).toHaveLength(1)
    const [own] = mod.baseSystem.streams
    expect(own.name).toBe('sync-test')
    expect(['tokens' in own, typeof own.tokensPortable]).toEqual([false, 'string'])
    expect(mod.baseSystem.jsxElements).toEqual([])
    expect('fragments' in mod.baseSystem).toBe(false)
    expect('cssChunks' in mod.baseSystem).toBe(false)
    expect('runtime' in mod.baseSystem).toBe(false)
  })

  it('links the generated packages into project node_modules', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
    })

    await sync(dir)

    for (const name of ['system', 'styled', 'react']) {
      const link = join(dir, 'node_modules', '@reference-ui', name)
      expect(lstatSync(link).isSymbolicLink()).toBe(true)
      expect(existsSync(join(link, 'package.json'))).toBe(true)
    }
  })

  it('fails loud without a config file', async () => {
    const dir = await writeProject({ 'theme/tokens.ts': TOKENS_FILE })

    await expect(sync(dir)).rejects.toBeInstanceOf(ConfigNotFoundError)
  })
})
