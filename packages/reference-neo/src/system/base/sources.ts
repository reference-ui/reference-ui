// Emitted-source builders for the generated system folder.
// It takes nothing at runtime and emits the authoring entry, the portable
// interface, and both declaration texts. The packager leg calls these pure
// builders and owns every write; the banner rides the shared leaf constant.

import { BASE_SYSTEM_HEADER } from '../../packager/constants.ts'
import type { BaseSystem } from './types.ts'

export function baseSystemInterfaceSource(): string {
  return [
    'export interface BaseSystem {',
    '  name: string',
    '  fragment: string',
    '  css?: string',
    '  jsxElements?: string[]',
    '}',
    '',
  ].join('\n')
}

export function baseSystemTypesSource(): string {
  return `${BASE_SYSTEM_HEADER}\n${baseSystemInterfaceSource()}export declare const baseSystem: BaseSystem\n`
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

export function systemTypesSource(): string {
  return [
    BASE_SYSTEM_HEADER,
    baseSystemInterfaceSource(),
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
    'export declare function getRhythm(n: number): string',
    'export declare function getRhythm(num: number, denom: number): string',
    'export declare const baseSystem: BaseSystem',
    '',
  ].join('\n')
}

export function baseSystemMjsSource(baseSystem: BaseSystem): string {
  return `${BASE_SYSTEM_HEADER}\nexport const baseSystem = ${JSON.stringify(baseSystem, null, 2)}\n`
}
