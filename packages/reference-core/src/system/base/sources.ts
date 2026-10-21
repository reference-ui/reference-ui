// Emitted-source builders for the generated system folder.
// It takes the published system for the two declaration texts and nothing
// else, and emits the authoring entry, the portable interface, and both
// declaration texts. The interface lists `jsxOwned` only for a system that
// carries it, so a system without owned data prints the declarations it
// always did. The packager leg calls these pure builders and owns every write;
// the banner rides the shared leaf constant. The entry's getRhythm is emitted from rhythm.ts by its source
// text, so the generated runtime prints what the compiler prints. The authoring
// calls take core's real token, font, keyframes and globalCss types; the builder
// inlines copies because the generated package depends on nothing, and
// sources.test.ts pins those copies to core's.

import { BASE_SYSTEM_HEADER } from '../../packager/constants.ts'
import { getRhythm } from './rhythm.ts'
import type { BaseSystem } from './types.ts'

/** The slice of a published system its declaration text depends on. */
export type DescribedSystem = Pick<BaseSystem, 'jsxOwned'>

function ownsProps(system: DescribedSystem): boolean {
  return Object.keys(system.jsxOwned ?? {}).length > 0
}

export function baseSystemInterfaceSource(system: DescribedSystem = {}): string {
  return [
    'export interface SystemStreams {',
    '  name: string',
    '  root?: string',
    '  preamble: string',
    '  reset?: string',
    '  global?: string',
    '  tokens?: string',
    '  tokensPortable?: string',
    '  recipes?: string',
    '  utilities?: string',
    '  package?: string',
    '}',
    'export interface FragmentNode {',
    '  name: string',
    '  bundle: string',
    '}',
    'export interface BaseSystem {',
    '  name: string',
    '  fragment: string',
    '  fragments?: FragmentNode[]',
    '  streams?: SystemStreams[]',
    '  jsxElements?: string[]',
    ...(ownsProps(system) ? ['  jsxOwned?: Record<string, string[]>'] : []),
    '}',
    '',
  ].join('\n')
}

export function baseSystemTypesSource(system: DescribedSystem = {}): string {
  return `${BASE_SYSTEM_HEADER}\n${baseSystemInterfaceSource(system)}export declare const baseSystem: BaseSystem\n`
}

export function systemEntrySource(): string {
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
    `export const getRhythm = ${getRhythm.toString()}`,
    "export { baseSystem } from './baseSystem.mjs'",
    '',
  ].join('\n')
}

// Core's authoring types for the four calls, copied from collect/surface. The
// generated package depends on nothing, so the entry carries its own copies.
// ReferenceTokenLeaf keeps core's index signature, so an unknown leaf key is still a valid leaf.
const AUTHORING_TYPES = [
  'export interface ReferenceTokenLeaf {',
  '  value?: unknown',
  '  light?: unknown',
  '  dark?: unknown',
  '  description?: string',
  '  [key: string]: unknown',
  '}',
  'export interface ReferenceTokenConfig {',
  '  [key: string]: ReferenceTokenLeaf | ReferenceTokenConfig',
  '}',
  'export type TokenConfig = ReferenceTokenConfig',
  'export type KeyframesConfig = Record<string, Record<string, Record<string, string | number>>>',
  'export interface FontFaceRule {',
  '  src: string',
  '  fontWeight?: string',
  '  fontStyle?: string',
  '  fontDisplay?: string',
  '  sizeAdjust?: string',
  '  descentOverride?: string',
  '}',
  "export type FontWeightName = 'thin' | 'light' | 'normal' | 'semibold' | 'bold' | 'black'",
  'export interface FontOptions {',
  '  value: string',
  '  fontFace: FontFaceRule | FontFaceRule[]',
  '  weights: Partial<Record<FontWeightName, string>>',
  '  css?: Record<string, string>',
  '}',
  'export interface GlobalCssRule {',
  '  [property: string]: unknown',
  '}',
  'export type GlobalCssConfig = Record<string, GlobalCssRule>',
]

export function systemTypesSource(system: DescribedSystem = {}): string {
  return [
    BASE_SYSTEM_HEADER,
    baseSystemInterfaceSource(system),
    "export type LogChannel = 'compiler'",
    "export type StrictCategory = 'colors' | 'radii' | 'spacing'",
    'export interface ReferenceUIConfig {',
    '  name: string',
    '  include: string[]',
    '  extends?: BaseSystem[]',
    '  layers?: BaseSystem[]',
    '  strict?: readonly StrictCategory[]',
    '  jsxElements?: string[]',
    '  staticCss?: Record<string, string[]>',
    '  normalizeCss?: boolean',
    '  logs?: LogChannel[]',
    '  mcp?: ReferenceUIMcpConfig',
    '  useReferenceLibrary?: boolean',
    '  use_reference_library?: boolean',
    '  useReferenceIcons?: boolean',
    '  use_reference_icons?: boolean',
    '}',
    'export interface ReferenceUIMcpConfig {',
    '  include?: string[]',
    '  exclude?: string[]',
    '}',
    ...AUTHORING_TYPES,
    'export declare function defineConfig(config: ReferenceUIConfig): ReferenceUIConfig',
    'export declare function tokens(config: TokenConfig): void',
    'export declare function keyframes(config: KeyframesConfig): void',
    'export declare function font(name: string, options: FontOptions): void',
    'export declare function globalCss(config: GlobalCssConfig): void',
    'export declare function getRhythm(n: number): string',
    'export declare function getRhythm(num: number, denom: number): string',
    'export declare const baseSystem: BaseSystem',
    '',
  ].join('\n')
}

export function baseSystemMjsSource(baseSystem: BaseSystem): string {
  return `${BASE_SYSTEM_HEADER}\nexport const baseSystem = ${JSON.stringify(baseSystem, null, 2)}\n`
}
