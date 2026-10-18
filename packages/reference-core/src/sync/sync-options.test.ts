// Sync option-plumbing proofs over temp projects with the native compiler.
// They take staticCss, normalizeCss, and include fixtures and assert each
// option lands in the spec, the sheet, and the frozen request. Every run
// compiles for real: no stubs stand between sync and the engine.

import { readFileSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

describe('sync staticCss plumbing', () => {
  it('emits static utilities with no call site and records them in the spec', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile("  staticCss: { color: ['brand'] },"),
      'theme/tokens.ts': TOKENS_FILE,
    })

    const { spec } = await sync(dir)

    expect(spec.staticCss).toEqual({ color: ['brand'] })
    const evaluated = JSON.parse(readFileSync(outFile(dir, 'system/evaluated-system.json'), 'utf-8')) as {
      staticCss: Record<string, string[]>
    }
    expect(evaluated.staticCss).toEqual({ color: ['brand'] })
    const styles = readFileSync(outFile(dir, 'styled/styles.css'), 'utf-8')
    expect(styles).toContain('sync-test__c_brand')
  })
})

describe('sync normalizeCss', () => {
  async function hasReset(extra: string): Promise<boolean> {
    const files = { 'ui.config.ts': configFile(extra), 'theme/tokens.ts': TOKENS_FILE }
    const dir = await writeProject(files)
    await sync(dir)
    return readFileSync(outFile(dir, 'styled/styles.css'), 'utf-8').includes('@layer reset {')
  }
  it('ships reset by default and omits it only when false', async () => {
    expect(await hasReset('')).toBe(true)
    expect(await hasReset('  normalizeCss: false,')).toBe(false)
  })
})

describe('sync include scoping', () => {
  it('sends the config include globs on the frozen request', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
    })

    await sync(dir)

    const request = JSON.parse(
      readFileSync(outFile(dir, 'system/compile-request.json'), 'utf-8')
    ) as { include: string[] }
    expect(request.include).toEqual(['theme/**/*.{ts,tsx}'])
  })
})
