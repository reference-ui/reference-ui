// Unit tests for Neo sync over temp projects with the native compiler.
// They take fixture configs plus author files and assert the published folder.
// Every run compiles for real: no stubs stand between sync and the engine.

import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfigNotFoundError } from '../config/errors.ts'
import { sync } from './index.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
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

function snapshotFolder(outDir: string): string[] {
  const files: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
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

    const jsx = JSON.parse(readFileSync(outFile(dir, 'system/jsx-elements.json'), 'utf-8')) as {
      primitives: string[]
      local: string[]
      merged: string[]
    }
    expect(jsx.primitives).toEqual([])
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

describe('sync runtime leg', () => {
  it('emits plans for source wants with a pre-registered css bundle', async () => {
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
    expect(mod.css({ color: 'missing' })).toBe('')
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
        schemaVersion: number
        name: string
        fragments: Array<{ code: string }>
        cssChunks: unknown[]
        jsxElements: string[]
      }
    }
    expect(mod.baseSystem.schemaVersion).toBe(1)
    expect(mod.baseSystem.name).toBe('sync-test')
    expect(mod.baseSystem.fragments.some((fragment) => fragment.code.includes('brand'))).toBe(true)
    expect(mod.baseSystem.cssChunks.length).toBe(1)
    expect(mod.baseSystem.jsxElements).toEqual([])
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

  it('succeeds through unlocated warnings such as display:true', async () => {
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
