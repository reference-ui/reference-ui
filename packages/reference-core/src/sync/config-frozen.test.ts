// Proof that sync never writes to the config object it loaded. config/evaluate.ts hands every sync of an unchanged
// bundle the same export, so an in-place write would carry into later syncs. The evaluator is wrapped to deep-freeze
// what it returns; a config with extends, layers, staticCss, strict and jsxElements then syncs twice, and a write
// anywhere in either pass throws instead of passing quietly. Upstreams are real published systems, synced first.

import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLastLoadedUserConfig } from '../config/load.ts'
import { cleanDir } from './clean.ts'
import { sync } from './index.ts'

function deepFreeze(value: unknown, seen = new Set<unknown>()): void {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null || seen.has(value)) return
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (descriptor && 'value' in descriptor) deepFreeze(descriptor.value, seen)
  }
  Object.freeze(value)
}

vi.mock('../config/evaluate.ts', async importOriginal => {
  const original = await importOriginal<typeof import('../config/evaluate.ts')>()
  return {
    ...original,
    evaluateConfig: async (...args: Parameters<typeof original.evaluateConfig>) => {
      const value = await original.evaluateConfig(...args)
      deepFreeze(value)
      return value
    },
  }
})

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => cleanDir(dir)))
})

async function writeTree(root: string, files: Record<string, string>): Promise<void> {
  for (const [name, content] of Object.entries(files)) {
    const path = join(root, name)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content)
  }
}

function upstreamFiles(name: string, color: string): Record<string, string> {
  return {
    'ui.config.ts': [
      "import { defineConfig } from '@reference-ui/core'",
      `export default defineConfig({ name: '${name}', include: ['theme/**/*.{ts,tsx}'] })`,
      '',
    ].join('\n'),
    'theme/tokens.ts': [
      "import { tokens } from '@reference-ui/core'",
      `tokens({ colors: { ${name.replace(/-/g, '')}Ink: { value: '${color}' } } })`,
      '',
    ].join('\n'),
    'theme/ink.ts': [
      "import { css } from '@reference-ui/react'",
      `export const ink = css({ color: '${name.replace(/-/g, '')}Ink' })`,
      '',
    ].join('\n'),
  }
}

const CONSUMER_CONFIG = [
  "import { defineConfig } from '@reference-ui/core'",
  "import { baseSystem as ext } from '../ext/.reference-ui/system/baseSystem.mjs'",
  "import { baseSystem as lay } from '../lay/.reference-ui/system/baseSystem.mjs'",
  '',
  'export default defineConfig({',
  "  name: 'frozen-consumer',",
  "  include: ['theme/**/*.{ts,tsx}'],",
  '  extends: [ext],',
  '  layers: [lay],',
  "  staticCss: { color: ['frozenextInk'] },",
  "  strict: ['colors'],",
  "  jsxElements: ['FrozenPanel'],",
  '})',
  '',
].join('\n')

describe('sync and the shared config object', () => {
  it('syncs twice against a deep-frozen config with every shared field set', async () => {
    const root = await mkdtemp(join(tmpdir(), 'core-config-frozen-'))
    tempDirs.push(root)
    await writeTree(join(root, 'ext'), upstreamFiles('frozen-ext', '#1d4ed8'))
    await writeTree(join(root, 'lay'), upstreamFiles('frozen-lay', '#be185d'))
    await writeTree(join(root, 'app'), {
      'ui.config.ts': CONSUMER_CONFIG,
      'theme/tokens.ts': [
        "import { tokens } from '@reference-ui/core'",
        "tokens({ colors: { own: { value: '#15803d' } } })",
        '',
      ].join('\n'),
    })
    await sync(join(root, 'ext'))
    await sync(join(root, 'lay'))

    const app = join(root, 'app')
    await sync(app)
    const first = getLastLoadedUserConfig(app)?.config
    await sync(app)
    const second = getLastLoadedUserConfig(app)?.config

    expect(second).toBe(first)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first?.extends?.[0])).toBe(true)
    expect(Object.isFrozen(first?.layers?.[0])).toBe(true)
  })
})
