// Sync diagnostics proofs over temp projects with the native compiler.
// They take error, warning, and dynamic fixtures and assert located
// failures leave no folder, warnings print without failing, and the
// opt-in compiler channel never leaks into userspace warnings. Every run
// compiles for real: no stubs stand between sync and the engine.

import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

const BACKCHANNEL_FILE = [
  "import { css } from '@reference-ui/react'",
  '',
  "const palette = ['red', 'blue']",
  '',
  'export function paint(i: number): string {',
  '  return css({ color: palette[i] })',
  '}',
  '',
  'export function tint(themeColor: string): string {',
  '  return css({ color: themeColor })',
  '}',
  '',
  'export function spreadIt(overrides: Record<string, string>): string {',
  "  return css({ color: 'brand', ...overrides })",
  '}',
  '',
  'const alwaysOn = true',
  '',
  "export const branched = css({ borderColor: alwaysOn ? 'white' : 'black' })",
  '',
  'export const probe = paint(0)',
  '',
].join('\n')

// Mirror of the ATM-DIAG-07 channel-family predicate: true facts that
// prove no exact runtime miss ride the compiler channel only.
function hasChannelCode(output: string): boolean {
  return /ATM-W-DYNAMIC-|ATM-W-UNFOLDABLE-SPREAD|ATM-I-HARVEST-SINK|ATM-I-DEAD-BRANCH/.test(output)
}

async function syncWithWarnCapture(dir: string): Promise<string[]> {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    await sync(dir)
    // Capture before restore: mockRestore clears the call history.
    return spy.mock.calls.map((args) => String(args[0]))
  } finally {
    spy.mockRestore()
  }
}

describe('sync diagnostics', () => {
  it('rejects with file and line on error diagnostics and leaves no folder', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
      'theme/bad.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        "export const cls = css({ color: '{colors.nope}' })",
        '',
      ].join('\n'),
    })

    await expect(sync(dir)).rejects.toThrowError(/bad\.ts:3/)
    await expect(sync(dir)).rejects.toThrowError(/unknown token reference `\{colors\.nope\}`/)
    expect(existsSync(outFile(dir))).toBe(false)
  })

  it('succeeds through located warnings such as display:true', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
      'theme/warn.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'export const cls = css({ display: true })',
        '',
      ].join('\n'),
    })

    await sync(dir)

    expect(existsSync(outFile(dir, 'styled/styles.css'))).toBe(true)
  })

  it('prints compile warnings to the sync log without failing', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile("  staticCss: { notAStyleProp: ['x'] },"),
      'theme/tokens.ts': TOKENS_FILE,
    })

    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let output = ''
    try {
      await sync(dir)
      // Capture before restore: mockRestore clears the call history.
      output = spy.mock.calls.map((args) => String(args[0])).join('\n')
    } finally {
      spy.mockRestore()
    }

    expect(output).toContain('[neo] sync warning ATM-W-UNKNOWN-PROPERTY:')
    expect(output).toContain('Unknown property in staticCss')
    expect(existsSync(outFile(dir, 'styled/styles.css'))).toBe(true)
  })

  it('stays silent when the compile reports no warnings', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
    })

    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let calls = -1
    try {
      await sync(dir)
      // Capture before restore: mockRestore clears the call history.
      calls = spy.mock.calls.length
    } finally {
      spy.mockRestore()
    }

    expect(calls).toBe(0)
  })
})

describe('sync compiler backchannel', () => {
  it('prints compiler diagnostics on the opt-in channel without leaking them into userspace warnings', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile("  logs: ['compiler'],"),
      'theme/tokens.ts': TOKENS_FILE,
      'theme/dynamic.ts': BACKCHANNEL_FILE,
    })

    const calls = await syncWithWarnCapture(dir)

    const compiler = calls.filter((call) => call.includes('[neo] compiler'))
    expect(compiler).toHaveLength(1)
    expect(compiler[0]).toMatch(/ATM-W-DYNAMIC-[A-Z0-9-]+/)
    expect(compiler[0]).toContain('ATM-W-UNFOLDABLE-SPREAD')
    expect(compiler[0]).toContain('ATM-I-HARVEST-SINK')

    const userspace = calls.filter((call) => call.includes('[neo] sync warning')).join('\n')
    expect(hasChannelCode(userspace)).toBe(false)

    const request = JSON.parse(
      readFileSync(outFile(dir, 'system/compile-request.json'), 'utf-8')
    ) as { logs?: string[] }
    expect(request.logs).toEqual(['compiler'])
    expect(existsSync(outFile(dir, 'styled/styles.css'))).toBe(true)
  })

  it('prints no compiler output for the same world without the opt-in', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
      'theme/dynamic.ts': BACKCHANNEL_FILE,
    })

    const calls = await syncWithWarnCapture(dir)

    expect(calls.join('\n')).not.toContain('[neo] compiler')

    const request = JSON.parse(
      readFileSync(outFile(dir, 'system/compile-request.json'), 'utf-8')
    ) as Record<string, unknown>
    expect('logs' in request).toBe(false)
    expect(existsSync(outFile(dir, 'styled/styles.css'))).toBe(true)
  })
})
