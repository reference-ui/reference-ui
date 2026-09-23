// System leg of the Neo generated folder.
// It takes the publish input and emits the authoring entry, the evaluated
// spec, the jsx artifact, the portable base system, and the package manifest.
// The published base system is the singular BaseSystem shape the extends
// validator and reader consume: name plus the bundled fragment string.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BaseSystem } from '../../config/types.ts'
import { BASE_SYSTEM_HEADER, GENERATED_VERSION, type PublishInput } from './types.ts'

function publishedBaseSystem(input: PublishInput): BaseSystem {
  return {
    name: input.spec.name,
    fragment: input.portableFragment,
    css: input.portableStylesheet,
    jsxElements: input.jsx.merged,
  }
}

function baseSystemInterfaceSource(): string {
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

function baseSystemTypesSource(): string {
  return `${BASE_SYSTEM_HEADER}\n${baseSystemInterfaceSource()}export declare const baseSystem: BaseSystem\n`
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

export function writeSystemDir(input: PublishInput): void {
  const dir = join(input.outDir, 'system')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'baseSystem.mjs'),
    baseSystemMjsSource(publishedBaseSystem(input)),
    'utf-8'
  )
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
