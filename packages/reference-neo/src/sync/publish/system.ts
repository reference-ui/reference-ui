// System leg of the Neo generated folder.
// It takes the publish input and emits the authoring entry, the evaluated
// spec, the jsx artifact, and the package manifest, plus it stages the
// portable base system for the runtime leg: baseSystem.mjs is written once,
// with the real runtime, when publishRuntimeBundle finalizes the stage.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  EvaluatedSystemSpec,
  NativeRuntimeArtifact,
  PortableBaseSystem,
  PortableFragment,
} from '@reference-ui/rust/contracts'
import { NAMER_RULES_VERSION } from '@reference-ui/rust/namer'
import { createHash } from 'node:crypto'
import { BASE_SYSTEM_HEADER, GENERATED_VERSION, type PublishInput } from './types.ts'

function portableHash(css: string): string {
  return createHash('sha256').update(css, 'utf-8').digest('hex').slice(0, 16)
}

function firstProvenanceSource(spec: EvaluatedSystemSpec): string {
  for (const entry of spec.provenance) {
    if (typeof entry.source === 'string' && entry.source.length > 0) return entry.source
  }
  return 'local'
}

function portableFragments(input: PublishInput): PortableFragment[] {
  if (input.fragments !== undefined && input.fragments.length > 0) return input.fragments
  return [{ source: firstProvenanceSource(input.spec), code: input.portableFragment }]
}

function emptyRuntime(): NativeRuntimeArtifact {
  return {
    schemaVersion: 2,
    namer: {
      rulesVersion: NAMER_RULES_VERSION,
      aliases: {},
      prefixes: {},
      lowerings: {},
      keywords: {},
      weightKeywords: [],
      colorProps: [],
      breakpoints: [],
      breakpointWidths: {},
      conditions: [],
      fonts: {},
    },
    recipes: {},
    stylePropNames: [],
  }
}

function portableBaseSystem(input: PublishInput): PortableBaseSystem {
  return {
    schemaVersion: 1,
    name: input.spec.name,
    fragments: portableFragments(input),
    cssChunks: [
      {
        system: input.spec.name,
        hash: portableHash(input.portableStylesheet),
        css: input.portableStylesheet,
      },
    ],
    runtime: input.runtime ?? emptyRuntime(),
    jsxElements: input.jsx.merged,
  }
}

function portableTypesSource(): string {
  return [
    'export interface PortableFragment {',
    '  source: string',
    '  code: string',
    '}',
    'export interface PortableCssChunk {',
    '  system: string',
    '  hash: string',
    '  css: string',
    '}',
    'export interface RuntimeDeclaration {',
    '  slot: string',
    '  className: string',
    '}',
    'export interface RuntimeStylePlan {',
    '  system: string',
    '  when: string[]',
    '  prop: string',
    '  value: unknown',
    '  important: boolean',
    '  declarations: RuntimeDeclaration[]',
    '}',
    'export interface RecipeRuntimeTable {',
    '  qualifiedName: string',
    '  className: string',
    '  base: string',
    '  variantKeys: string[]',
    '  variantMap: Record<string, Record<string, string>>',
    '  defaultVariants: Record<string, string>',
    '  compoundVariants: Array<Record<string, unknown>>',
    '  combinations?: Record<string, string>',
    '  responsiveBreakpoints?: string[]',
    '  responsiveVariantMap?: Record<string, Record<string, Record<string, string>>>',
    '}',
    'export type NamerGuard = \'bool:true\' | \'empty\' | \'whole\' | { eq: string } | { in: string }',
    'export type LowerStep =',
    '  | { on?: NamerGuard; longhands: [string, string, string, string]; shape: \'trbl\' }',
    '  | { on?: NamerGuard; longhands: [string, string, string]; shape: \'trio\'; style: \'border\' | \'outline\' }',
    '  | { on?: NamerGuard; longhands: [string, string]; shape: \'pair\' }',
    '  | { on?: NamerGuard; rewrite: Record<string, string> }',
    '  | { on?: NamerGuard; emit: Array<[string, string]> }',
    '  | { on?: NamerGuard; macro: \'font\' | \'weight\' }',
    '  | { on?: NamerGuard; keep: true }',
    '  | { drop: true }',
    'export interface NamerFontTable {',
    '  weight: string',
    '  weights: Record<string, string>',
    '  css: Array<[string, string]>',
    '}',
    'export interface NamerTables {',
    '  rulesVersion: number',
    '  aliases: Record<string, string>',
    '  prefixes: Record<string, string>',
    '  lowerings: Record<string, LowerStep[]>',
    '  keywords: Record<string, string[]>',
    '  weightKeywords: Array<[string, string]>',
    '  colorProps: string[]',
    '  breakpoints: string[]',
    '  conditions: string[]',
    '  fonts: Record<string, NamerFontTable>',
    '}',
    'export interface NativeRuntimeArtifact {',
    '  schemaVersion: 2',
    '  namer: NamerTables',
    '  recipes: Record<string, RecipeRuntimeTable>',
    '  stylePropNames: string[]',
    '}',
    'export interface PortableBaseSystem {',
    '  schemaVersion: 1',
    '  name: string',
    '  fragments: PortableFragment[]',
    '  cssChunks: PortableCssChunk[]',
    '  runtime: NativeRuntimeArtifact',
    '  jsxElements: string[]',
    '}',
    '',
  ].join('\n')
}

function baseSystemTypesSource(): string {
  return `${BASE_SYSTEM_HEADER}\n${portableTypesSource()}export declare const baseSystem: PortableBaseSystem\n`
}

function systemEntrySource(): string {
  return [
    BASE_SYSTEM_HEADER,
    'export function defineConfig(config) {',
    '  return config',
    '}',
    'function collect(key, fragment) {',
    '  const bucket = globalThis[key]',
    '  if (Array.isArray(bucket)) {',
    '    bucket.push(fragment)',
    '  }',
    '}',
    'export function tokens(config) {',
    "  collect('__refTokensCollector', config)",
    '}',
    'export function keyframes(config) {',
    "  collect('__refKeyframesCollector', config)",
    '}',
    'export function font(name, options) {',
    "  collect('__refFontCollector', { name, ...options })",
    '}',
    'export function globalCss(config) {',
    "  collect('__refGlobalCssCollector', config)",
    '}',
    'export function extendPattern(extension) {',
    "  collect('__refBoxPatternCollector', extension)",
    '}',
    'export function getRhythm(num, denom) {',
    '  if (denom !== undefined) {',
    '    return num === 1',
    '      ? `calc(var(--spacing-root) / $' + '{denom})`',
    '      : `calc($' + '{num} * var(--spacing-root) / $' + '{denom})`',
    '  }',
    "  if (num === 1) return 'var(--spacing-root)'",
    '  return `calc($' + '{num} * var(--spacing-root))`',
    '}',
    "export { baseSystem } from './baseSystem.mjs'",
    '',
  ].join('\n')
}

function systemTypesSource(): string {
  return [
    BASE_SYSTEM_HEADER,
    portableTypesSource(),
    'export type BaseSystem = PortableBaseSystem',
    'export interface ReferenceUIConfig {',
    '  name: string',
    '  include: string[]',
    '  extends?: BaseSystem[]',
    '  jsxElements?: string[]',
    '  normalizeCss?: boolean',
    '  debug?: boolean',
    '}',
    'export declare function defineConfig(config: ReferenceUIConfig): ReferenceUIConfig',
    'export declare function tokens(config: Record<string, unknown>): void',
    'export declare function keyframes(config: Record<string, unknown>): void',
    'export declare function font(name: string, options: Record<string, unknown>): void',
    'export declare function globalCss(config: Record<string, unknown>): void',
    'export declare function extendPattern(extension: Record<string, unknown>): void',
    'export declare function getRhythm(n: number): string',
    'export declare function getRhythm(num: number, denom: number): string',
    'export declare const baseSystem: PortableBaseSystem',
    '',
  ].join('\n')
}

export function baseSystemMjsSource(baseSystem: PortableBaseSystem): string {
  return `${BASE_SYSTEM_HEADER}\nexport const baseSystem = ${JSON.stringify(baseSystem, null, 2)}\n`
}

// The staged base system, keyed by outDir: writeSystemDir builds it, and
// publishRuntimeBundle sets the real runtime and writes it once. Both legs
// always run paired (sync + deepsee worker); a stage is consumed on write.
const stagedBaseSystems = new Map<string, PortableBaseSystem>()

export function stageBaseSystem(outDir: string, baseSystem: PortableBaseSystem): void {
  stagedBaseSystems.set(outDir, baseSystem)
}

export function takeStagedBaseSystem(outDir: string): PortableBaseSystem | undefined {
  const staged = stagedBaseSystems.get(outDir)
  stagedBaseSystems.delete(outDir)
  return staged
}

export function writeSystemDir(input: PublishInput): void {
  const dir = join(input.outDir, 'system')
  mkdirSync(dir, { recursive: true })
  stageBaseSystem(input.outDir, portableBaseSystem(input))
  writeFileSync(join(dir, 'baseSystem.d.mts'), baseSystemTypesSource(), 'utf-8')
  writeFileSync(join(dir, 'system.mjs'), systemEntrySource(), 'utf-8')
  writeFileSync(join(dir, 'system.d.mts'), systemTypesSource(), 'utf-8')
  writeFileSync(join(dir, 'evaluated-system.json'), `${JSON.stringify(input.spec, null, 2)}\n`, 'utf-8')
  writeFileSync(join(dir, 'jsx-elements.json'), `${JSON.stringify(input.jsx, null, 2)}\n`, 'utf-8')
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: '@reference-ui/system',
        version: GENERATED_VERSION,
        description: 'Neo generated design system',
        type: 'module',
        main: './system.mjs',
        types: './system.d.mts',
        exports: {
          '.': { types: './system.d.mts', import: './system.mjs' },
          './baseSystem': { types: './baseSystem.d.mts', import: './baseSystem.mjs' },
        },
      },
      null,
      2
    )}\n`,
    'utf-8'
  )
}
