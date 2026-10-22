// Type probes for the generated system authoring calls, run under strict tsc in scratch projects.
// The emitted entry and the stable surface take the same calls: valid shapes pass, and a misspelled token
// leaf key, a wrong font weight, a missing fontFace, a wrong keyframe value, a recipe without className, a
// string as tokens and a string rhythm each fail. Each emitted type also stays mutually assignable with core's.

import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { systemTypesSource } from './sources.ts'

const PACKAGE_ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const scratchDirs: string[] = []

const PROBE_TSCONFIG = {
  compilerOptions: {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    target: 'ES2022',
    lib: ['ES2022', 'DOM'],
    types: ['node'],
  },
  files: ['probe.ts'],
}

// The drift lines pin each emitted authoring type to core's own, in both directions. They name the
// emitted entry through its module id, so they run against the generated entry only.
const DRIFT_PROBE = [
  'import type {',
  '  BaseSystem as EmittedBaseSystem,',
  '  ExtendSystemOverrides as EmittedExtendSystemOverrides,',
  '  FontOptions as EmittedFontOptions,',
  '  GlobalCssConfig as EmittedGlobalCssConfig,',
  '  KeyframesConfig as EmittedKeyframesConfig,',
  '  RecipeConfig as EmittedRecipeConfig,',
  '  TokenConfig as EmittedTokenConfig,',
  "} from '@reference-ui/system'",
  "import type { BaseSystem as RealBaseSystem } from '../../../src/system/base/types.ts'",
  "import type { ExtendSystemOverrides as RealExtendSystemOverrides } from '../../../src/system/base/extend.ts'",
  'import type {',
  '  FontOptions as RealFontOptions,',
  '  GlobalCssConfig as RealGlobalCssConfig,',
  '  KeyframesConfig as RealKeyframesConfig,',
  '  RecipeConfig as RealRecipeConfig,',
  '  TokenConfig as RealTokenConfig,',
  "} from '../../../src/collect/surface/index.ts'",
  'type MutuallyAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false',
  'export const baseSystemShapes: MutuallyAssignable<EmittedBaseSystem, RealBaseSystem> = true',
  'export const extendShapes: MutuallyAssignable<EmittedExtendSystemOverrides, RealExtendSystemOverrides> = true',
  'export const recipeShapes: MutuallyAssignable<EmittedRecipeConfig, RealRecipeConfig> = true',
  'export const tokenShapes: MutuallyAssignable<EmittedTokenConfig, RealTokenConfig> = true',
  'export const keyframesShapes: MutuallyAssignable<EmittedKeyframesConfig, RealKeyframesConfig> = true',
  'export const fontShapes: MutuallyAssignable<EmittedFontOptions, RealFontOptions> = true',
  'export const globalCssShapes: MutuallyAssignable<EmittedGlobalCssConfig, RealGlobalCssConfig> = true',
]

// The calls run against both the emitted entry and the stable surface, so the two must accept the same valid
// shapes and reject the same wrong ones.
const AUTHORING_CALLS = [
  "import { extendSystem, font, getRhythm, globalCss, keyframes, recipe, tokens } from '@reference-ui/system'",
  "import type { BaseSystem, FontOptions, GlobalCssConfig, KeyframesConfig, RecipeConfig, TokenConfig } from '@reference-ui/system'",
  "const theme: TokenConfig = { colors: { brand: { value: '#7c3aed', description: 'Brand' } } }",
  'tokens(theme)',
  "const sans: FontOptions = { value: 'Inter, sans-serif', fontFace: { src: 'url(/fonts/inter.woff2)', fontWeight: '200 900' }, weights: { bold: '700' } }",
  "font('sans', sans)",
  "keyframes({ fade: { '0%': { opacity: '0' }, '100%': { opacity: 1 } } })",
  "globalCss({ ':root': { '--spacing-root': '0.5rem' }, body: { fontFamily: 'sans' } })",
  "const card: RecipeConfig = { className: 'card', base: { padding: '2r' }, variants: { tone: { quiet: { color: 'ink' } } }, defaultVariants: { tone: 'quiet' } }",
  'recipe(card)',
  "const base: BaseSystem = { name: 'lib', fragment: ';tokens()' }",
  "export const branded: BaseSystem = extendSystem(base, { tokens: { colors: { brand: { value: '#f00' } } } })",
  'export const rhythm: string[] = [getRhythm(2), getRhythm(1, 2), getRhythm(-1, 3)]',
  '// @ts-expect-error bld is not a font weight name',
  "font('sans', { value: 'Inter', fontFace: { src: 'url(/x.woff2)' }, weights: { bld: '700' } })",
  '// @ts-expect-error fontFace is required',
  "font('sans', { value: 'Inter', weights: { bold: '700' } })",
  '// @ts-expect-error opacity must be a string or a number',
  "keyframes({ fade: { from: { opacity: true } } })",
  '// @ts-expect-error valu is not a token leaf key',
  "tokens({ colors: { brand: { valu: '#f00' } } })",
  '// @ts-expect-error className is required',
  "recipe({ variants: { tone: { quiet: {} } } })",
  '// @ts-expect-error tokens must be a token tree, not a string',
  "extendSystem(base, { tokens: 'nope' })",
  '// @ts-expect-error getRhythm takes numbers',
  "getRhythm('2')",
]

describe('system entry authoring types under strict tsc', () => {
  afterEach(() => {
    for (const dir of scratchDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it('types the authoring calls from the emitted entry, pinned to core\'s types', () => {
    const dir = scratchDir('system-entry-types', { '@reference-ui/system': ['./system.d.mts'] })
    writeFileSync(join(dir, 'system.d.mts'), systemTypesSource())
    writeFileSync(join(dir, 'probe.ts'), probeSource(DRIFT_PROBE, AUTHORING_CALLS))
    expect(checkProbe(dir)).toBe('')
  }, 150000)

  it('types the same authoring calls from the stable surface', () => {
    const dir = scratchDir('system-surface-types', {
      '@reference-ui/system': [join(PACKAGE_ROOT, 'src', 'system-surface.d.ts')],
      '@reference-ui/core': [join(PACKAGE_ROOT, 'src', 'index.ts')],
    })
    writeFileSync(join(dir, 'probe.ts'), probeSource(AUTHORING_CALLS))
    expect(checkProbe(dir)).toBe('')
  }, 150000)
})

/** The probe source: each block one after another, with a trailing newline. */
function probeSource(...blocks: string[][]): string {
  return `${blocks.flat().join('\n')}\n`
}

/** A scratch project under the package's gitignored tests/.artifacts, with its own strict tsconfig and path map. */
function scratchDir(name: string, paths: Record<string, string[]>): string {
  const dir = join(PACKAGE_ROOT, 'tests', '.artifacts', `${name}-${process.pid}-${Date.now()}`)
  mkdirSync(dir, { recursive: true })
  scratchDirs.push(dir)
  const config = { ...PROBE_TSCONFIG, compilerOptions: { ...PROBE_TSCONFIG.compilerOptions, paths } }
  writeFileSync(join(dir, 'tsconfig.json'), `${JSON.stringify(config, null, 2)}\n`)
  return dir
}

/** Strict tsc over the probe project; returns the diagnostics, empty when clean. */
function checkProbe(dir: string): string {
  const tsc = join(PACKAGE_ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
  try {
    execFileSync(process.execPath, [tsc, '-p', dir, '--pretty', 'false'], { stdio: 'pipe', timeout: 120000 })
    return ''
  } catch (error) {
    const failure = error as { stdout?: unknown; stderr?: unknown }
    return `${String(failure.stdout ?? '')}${String(failure.stderr ?? '')}`
  }
}
