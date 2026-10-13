// Unit tests for the SyncedSystem register in the generated react types.
// They take a synced role plus the compiled prop names and assert that the none output is byte-identical to its golden, that the publisher declares the register, and that a consumer's fill narrows lib's register.
// The probes run strict tsc with declarations checked (no skipLibCheck) against a styled stub and react's real types, since the register only matters if the generated file itself compiles.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { generateReactTypesSource } from './generate.ts'

const PACKAGE_ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const NAMES = ['backgroundColor', 'color', 'p']
const RECIPE_NAMES = ['color', 'margin', 'p']
const RECIPES = {
  button: { variants: { tone: { accent: {}, muted: {} }, size: { sm: {}, lg: {} } } },
  badge: { variants: { tone: { loud: {} } } },
  plain: { base: { display: 'block' } },
}

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function golden(name: string): string {
  return readFileSync(join(PACKAGE_ROOT, 'src', 'primitives', 'generate', 'fixtures', name), 'utf-8')
}

describe('generateReactTypesSource synced register', () => {
  it('keeps the none output byte-identical to the pre-register golden', () => {
    expect(generateReactTypesSource({ stylePropNames: NAMES, recipes: {} })).toBe(
      golden('react-types-none-plain.golden.txt')
    )
    expect(generateReactTypesSource({ stylePropNames: RECIPE_NAMES, recipes: RECIPES, role: 'none' })).toBe(
      golden('react-types-none-recipes.golden.txt')
    )
  })

  it('treats an omitted role as none', () => {
    expect(generateReactTypesSource({ stylePropNames: NAMES, recipes: {} })).toBe(
      generateReactTypesSource({ stylePropNames: NAMES, recipes: {}, role: 'none' })
    )
  })

  it('publisher declares the register and routes the public names through it', () => {
    const source = generateReactTypesSource({ stylePropNames: NAMES, recipes: {}, role: 'publisher' })
    for (const line of [
      'export type LocalStylePropName = "backgroundColor" | "color" | "p"',
      "export type LocalStyleProps = Omit<NarrowStyleProps, 'font' | 'weight'> & {",
      "  [K in Exclude<LocalStylePropName, keyof NarrowStyleProps> | 'font' | 'weight']?: unknown",
      '  [K in StyleConditionKey]?: LocalStyleProps',
      "export type LocalPrimitiveCssProp = Omit<SystemStyleObject, 'font' | 'weight'> & { font?: unknown; weight?: unknown }",
      'export interface SyncedSystem {}',
      'export type StylePropName = SyncedSystem extends { stylePropName: infer V } ? V : LocalStylePropName',
      'export type StyleProps = SyncedSystem extends { styleProps: infer V } ? V : LocalStyleProps',
      'export type PrimitiveCssProp = SyncedSystem extends { cssProp: infer V } ? V : LocalPrimitiveCssProp',
    ]) {
      expect(source).toContain(line)
    }
    expect(source).not.toMatch(/^export type StyleProps = Omit</m)
    expect(source).not.toContain("declare module '@reference-ui/lib'")
  })

  it('consumer appends exactly one augmentation of the lib register to the none output', () => {
    const none = generateReactTypesSource({ stylePropNames: NAMES, recipes: {} })
    const consumer = generateReactTypesSource({ stylePropNames: NAMES, recipes: {}, role: 'consumer' })
    expect(consumer.startsWith(none)).toBe(true)
    expect(consumer.split("declare module '@reference-ui/lib'")).toHaveLength(2)
    expect(consumer).toContain(
      '  interface SyncedSystem { styleProps: StyleProps; cssProp: PrimitiveCssProp; stylePropName: StylePropName }'
    )
    expect(consumer).not.toContain('Local')
    expect(consumer).not.toContain('export interface SyncedSystem')
  })
})

describe('generateReactTypesSource synced register under strict tsc', () => {
  it('publisher output checks, and its public names fall back to the local set', () => {
    const dir = probeDir('__register-publisher')
    writeFileSync(
      join(dir, 'index.d.mts'),
      generateReactTypesSource({ stylePropNames: NAMES, recipes: {}, role: 'publisher' })
    )
    writeProbe(dir, [
      "import type { PrimitiveCssProp, StyleProps, StylePropName } from './index.mjs'",
      "const name: StylePropName = 'color'",
      "const copy: StyleProps = { color: 'brand' }",
      "const css: PrimitiveCssProp = { color: 'blue.300' }",
      'export const probe = [name, copy, css]',
    ])
    expect(checkDeclarations(dir).output).toBe('')
  }, 150000)

  it('consumer fill checks, and lib SyncedSystem narrows to the synced names', () => {
    const dir = probeDir('__register-consumer')
    writeFileSync(
      join(dir, 'index.d.mts'),
      generateReactTypesSource({ stylePropNames: NAMES, recipes: {}, role: 'consumer' })
    )
    writeLibStub(dir)
    writeProbe(dir, [
      "import type {} from './index.mjs'",
      "import type { SyncedSystem } from '@reference-ui/lib'",
      "const name: SyncedSystem['stylePropName'] = 'color'",
      'export const probe = [name]',
    ])
    expect(checkDeclarations(dir).output).toBe('')
  }, 150000)

  it('consumer fill rejects a name it never synced (red by design)', () => {
    const dir = probeDir('__register-consumer-red')
    writeFileSync(
      join(dir, 'index.d.mts'),
      generateReactTypesSource({ stylePropNames: NAMES, recipes: {}, role: 'consumer' })
    )
    writeLibStub(dir)
    writeProbe(dir, [
      "import type {} from './index.mjs'",
      "import type { SyncedSystem } from '@reference-ui/lib'",
      "const name: SyncedSystem['stylePropName'] = 'notAProp'",
      'export const probe = [name]',
    ])
    const result = checkDeclarations(dir)
    expect(result.ok).toBe(false)
    expect(result.output).toContain('TS2322')
  }, 150000)
})

/** A scratch project with the styled stub and react's real types linked in. */
function probeDir(name: string): string {
  const dir = join(PACKAGE_ROOT, 'tests', '.artifacts', `${name}-${process.pid}-${Date.now()}`)
  mkdirSync(dir, { recursive: true })
  tempDirs.push(dir)
  writeStyledStub(dir)
  mkdirSync(join(dir, 'node_modules', '@types'), { recursive: true })
  symlinkSync(join(PACKAGE_ROOT, 'node_modules', '@types', 'react'), join(dir, 'node_modules', '@types', 'react'), 'dir')
  return dir
}

function writeStyledStub(dir: string): void {
  const styledDir = join(dir, 'node_modules', '@reference-ui', 'styled')
  mkdirSync(styledDir, { recursive: true })
  writeFileSync(
    join(styledDir, 'package.json'),
    JSON.stringify({ name: '@reference-ui/styled', version: '0.0.0', types: './index.d.ts' })
  )
  writeFileSync(
    join(styledDir, 'index.d.ts'),
    [
      "export type StyleConditionKey = '_hover' | '@sm'",
      'export type StyleProps = {',
      '  color?: unknown',
      '  backgroundColor?: unknown',
      '  p?: unknown',
      '}',
      'export type SystemStyleObject = StyleProps & {',
      '  [K in StyleConditionKey]?: SystemStyleObject',
      '}',
      '',
    ].join('\n')
  )
}

/** The lib stub a synced consumer resolves: its register starts empty, as lib's does. */
function writeLibStub(dir: string): void {
  const libDir = join(dir, 'node_modules', '@reference-ui', 'lib')
  mkdirSync(libDir, { recursive: true })
  writeFileSync(
    join(libDir, 'package.json'),
    JSON.stringify({ name: '@reference-ui/lib', version: '0.0.0', types: './index.d.ts' })
  )
  writeFileSync(join(libDir, 'index.d.ts'), 'export interface SyncedSystem {}\n')
}

function writeProbe(dir: string, lines: string[]): void {
  writeFileSync(join(dir, 'probe.ts'), `${lines.join('\n')}\n`)
}

/**
 * Strict tsc over probe.ts with declarations checked, so the generated file
 * itself must compile. Only react's types load: ancestor @types would pull
 * unrelated declarations into the check.
 */
function checkDeclarations(dir: string): { ok: boolean; output: string } {
  const tsc = join(PACKAGE_ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
  const args = [
    tsc,
    '--ignoreConfig',
    '--noEmit',
    '--strict',
    '--target',
    'ES2022',
    '--lib',
    'ES2022,DOM',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--types',
    'react',
    'probe.ts',
  ]
  try {
    execFileSync(process.execPath, args, { cwd: dir, stdio: 'pipe', timeout: 120000 })
    return { ok: true, output: '' }
  } catch (error) {
    const failure = error as { stdout?: unknown; stderr?: unknown }
    return { ok: false, output: `${String(failure.stdout ?? '')}${String(failure.stderr ?? '')}` }
  }
}
