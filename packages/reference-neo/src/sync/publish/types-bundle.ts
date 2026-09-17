// Declaration leg of the Neo generated folder.
// It takes the output dir plus the evaluated spec and emits the central
// styled declarations, then wires the react entry types onto the named
// graph. Runs after the react bundle; styled stays data-only (D4).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { BASE_SYSTEM_HEADER } from './types.ts'

/**
 * Publish the styled type declarations plus the react named graph. Typegen
 * prints one central .d.ts from the evaluated spec into styled/types, then
 * the react entry types narrow their wide StyleProps onto it and re-export
 * the graph beside authored css()/recipe() declarations. Runs after the
 * react bundle; styled stays data-only (D4).
 */
export async function publishTypesBundle(outDir: string, spec: EvaluatedSystemSpec): Promise<void> {
  const typegen = (await import('@reference-ui/rust/typegen')) as unknown as {
    emitDtsSync(options: { baseSystem: unknown }): string
  }
  const typesDir = join(outDir, 'styled', 'types')
  mkdirSync(typesDir, { recursive: true })
  writeFileSync(
    join(typesDir, 'index.d.ts'),
    `${BASE_SYSTEM_HEADER}\n${typegen.emitDtsSync({ baseSystem: spec })}`,
    'utf-8'
  )
  const reactTypesPath = join(outDir, 'react', 'react.d.mts')
  const wideStyleProps = 'export type StyleProps = { [K in StylePropName]?: unknown }'
  const reactSource = readFileSync(reactTypesPath, 'utf-8')
  if (!reactSource.includes(wideStyleProps)) {
    throw new Error('cannot wire react types: wide StyleProps line missing from react.d.mts')
  }
  const styledImport = "import type { StyleProps, SystemStyleObject } from '@reference-ui/styled'"
  const namedGraph = [
    'export type * from \'@reference-ui/styled\'',
    '/** One css() input: a style object, a list of them, or a conditional skip. */',
    'export type CssStyles = SystemStyleObject | undefined | null | false',
    '/** Shared prop shape every primitive accepts: style props plus primitive extras. */',
    'export type PrimitiveProps = StyleProps & {',
    '  css?: PrimitiveCssProp',
    '  colorMode?: unknown',
    '  variant?: unknown',
    '}',
    'export declare function css(...styles: Array<CssStyles | CssStyles[]>): string',
    '/** Wide authoring object for recipe configs: recipes are authored TS, not typegen. */',
    'export type RecipeStyleObject = Record<string, unknown>',
    '/** One variant axis value an author may pass. */',
    'export type RecipePropValue = string | boolean | number',
    '/** One compound rule: axis predicates plus the styles applied when all match. */',
    'export interface RecipeCompoundConfig {',
    '  css: RecipeStyleObject',
    '  [axis: string]: unknown',
    '}',
    '/** Authored recipe: the className extraction keys on plus base, variants, compounds. */',
    'export interface RecipeConfig {',
    '  className: string',
    '  base?: RecipeStyleObject',
    '  variants?: Record<string, Record<string, RecipeStyleObject>>',
    '  defaultVariants?: Record<string, string>',
    '  compoundVariants?: RecipeCompoundConfig[]',
    '}',
    '/** Variant selection inferred from one recipe fn config: every axis optional. */',
    'export type RecipeVariantProps<T> = T extends RecipeRuntimeFn<infer C>',
    '  ? C extends { variants: Record<string, Record<string, unknown>> }',
    '    ? { [K in keyof C[\'variants\']]?: Extract<keyof C[\'variants\'][K], string> }',
    '    : Record<string, RecipePropValue | undefined | null>',
    '  : Record<string, RecipePropValue | undefined | null>',
    '/** Resolved recipe function: classes for a selection plus variant metadata. */',
    '/** Call positions route through RecipeVariantProps<RecipeRuntimeFn<TConfig>> (T3): */',
    '/** RecipeVariantProps<TConfig> would miss the fn-config infer and fall wide. */',
    'export interface RecipeRuntimeFn<TConfig extends RecipeConfig = RecipeConfig> {',
    '  (props?: RecipeVariantProps<RecipeRuntimeFn<TConfig>>): string',
    '  raw(props?: RecipeVariantProps<RecipeRuntimeFn<TConfig>>): RecipeStyleObject',
    '  variantKeys: string[]',
    '  variantMap: Record<string, string[]>',
    '  splitVariantProps(props: RecipeVariantProps<RecipeRuntimeFn<TConfig>>): [RecipeVariantProps<RecipeRuntimeFn<TConfig>>, RecipeVariantProps<RecipeRuntimeFn<TConfig>>]',
    '}',
    'export declare function recipe<const TConfig extends RecipeConfig>(config: TConfig): RecipeRuntimeFn<TConfig>',
    '',
  ]
  writeFileSync(
    reactTypesPath,
    reactSource.replace(wideStyleProps, styledImport) + namedGraph.join('\n'),
    'utf-8'
  )
}
