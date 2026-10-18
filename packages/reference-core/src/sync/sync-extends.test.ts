// Sync extends-adoption proofs over temp projects with the native compiler.
// They take upstream fragments plus local author files and assert the
// compiled sheet threads extends while local leaves win conflicts.
// Every run compiles for real: no stubs stand between sync and the engine.

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

describe('sync extends adoption', () => {
  it('threads extends fragments into the compiled sheet', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(
        "  extends: [{ name: 'upstream', fragment: \"tokens({ colors: { up: { value: '#ffffff' } } })\" }],"
      ),
      'theme/tokens.ts': TOKENS_FILE,
    })

    await sync(dir)

    const styles = readFileSync(outFile(dir, 'styled/styles.css'), 'utf-8')
    expect(styles).toContain('--colors-up: #ffffff')
    expect(styles).toContain('--colors-brand: #7c3aed')
  })

  it('lets local fragments win over upstream on the same leaf', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(
        "  extends: [{ name: 'upstream', fragment: \"tokens({ colors: { shared: { value: '#111111' } } })\", jsxElements: ['UpstreamCard'] }],\n  jsxElements: ['LocalPanel'],"
      ),
      'theme/tokens.ts': [
        "import { tokens } from '@reference-ui/neo'",
        '',
        'tokens({',
        '  colors: {',
        "    shared: { value: '#222222' },",
        '  },',
        '})',
        '',
      ].join('\n'),
    })

    await sync(dir)

    const styles = readFileSync(outFile(dir, 'styled/styles.css'), 'utf-8')
    expect(styles).toContain('--colors-shared: #222222')
    expect(styles).not.toContain('#111111')
    const jsx = JSON.parse(readFileSync(outFile(dir, 'system/jsx-elements.json'), 'utf-8')) as {
      upstream: string[]
      merged: string[]
    }
    expect(jsx.upstream).toEqual(['UpstreamCard'])
    expect(jsx.merged).toEqual(['LocalPanel', 'UpstreamCard'])
  })
})
