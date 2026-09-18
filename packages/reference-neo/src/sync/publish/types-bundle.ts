// Declaration leg of the Neo generated folder.
// It takes the output dir plus the evaluated spec and emits the central
// styled declarations, then wires the react entry types onto the named
// graph. Runs after the react bundle; styled stays data-only (D4).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { BASE_SYSTEM_HEADER } from './types.ts'

/**
 * Publish the styled subpath declarations beside the central index: the root
 * entry, the tokens module, and the three classic types modules. Every file
 * re-exports or derives from the central typegen index, so the subpaths track
 * the evaluated spec with no second source of truth. Runs inside the
 * declaration leg; styled stays data-only (D4).
 */
function writeStyledSubpathDecls(outDir: string): void {
  const styledDir = join(outDir, 'styled')
  const typesDir = join(styledDir, 'types')
  const root = `${BASE_SYSTEM_HEADER}\nexport type * from './types/index.js'\n`
  const files: Array<[string, string]> = [
    [join(styledDir, 'index.d.ts'), root],
    [join(styledDir, 'tokens.d.ts'), root],
    [
      join(typesDir, 'conditions.d.ts'),
      `${BASE_SYSTEM_HEADER}\nimport type { StyleConditionKey } from './index.js'\n/** Condition table: every generated condition key maps to its selector. */\nexport type Conditions = { [K in StyleConditionKey]: string }\n`,
    ],
    [
      join(typesDir, 'prop-type.d.ts'),
      `${BASE_SYSTEM_HEADER}\nimport type { StyleProps } from './index.js'\n/** Utility table: every generated style prop maps to its value domain. */\nexport type UtilityValues = { [K in keyof StyleProps]: StyleProps[K] }\n`,
    ],
    [
      join(typesDir, 'style-props.d.ts'),
      `${BASE_SYSTEM_HEADER}\nimport type { StyleProps } from './index.js'\n/** System style props under the classic module name. */\nexport type SystemProperties = StyleProps\n`,
    ],
  ]
  for (const [file, text] of files) writeFileSync(file, text, 'utf-8')
}

/**
 * Wire the react StyleProps onto the styled index: typegen precision where
 * tokens exist, open over every other compiled prop plus the condition keys.
 * Font scopes stay in styled under FontProps; their union would poison prop
 * spreads with distribution. Returns the import plus the merged declaration.
 */
function stylePropsWiring(): string {
  return [
    "import type { StyleConditionKey, StyleProps as NarrowStyleProps, SystemStyleObject } from '@reference-ui/styled'",
    '/** React style props: typegen precision where tokens exist, open everywhere else. */',
    'export type StyleProps = Omit<NarrowStyleProps, \'font\' | \'weight\'> & {',
    "  [K in Exclude<StylePropName, keyof NarrowStyleProps> | 'font' | 'weight']?: unknown",
    '} & {',
    '  [K in StyleConditionKey]?: StyleProps',
    '}',
  ].join('\n')
}

/**
 * Publish the styled type declarations plus the react named graph. Typegen
 * prints one central .d.ts from the evaluated spec into styled/types, then
 * the react entry types merge their wide StyleProps with it and re-export
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
  writeStyledSubpathDecls(outDir)
  const reactTypesPath = join(outDir, 'react', 'react.d.mts')
  const wideStyleProps = 'export type StyleProps = { [K in StylePropName]?: unknown }'
  const reactSource = readFileSync(reactTypesPath, 'utf-8')
  if (!reactSource.includes(wideStyleProps)) {
    throw new Error('cannot wire react types: wide StyleProps line missing from react.d.mts')
  }
  const styledImport = stylePropsWiring()
  const namedGraph = [
    'export type * from \'@reference-ui/styled\'',
    '/** One css() input: a style object, a list of them, or a conditional skip. */',
    'export type CssStyles = SystemStyleObject | undefined | null | false',
    '/** Shared prop shape every primitive accepts: native props for one tag plus style props and primitive extras. */',
    'export type PrimitiveProps<T extends PrimitiveTag> = Omit<',
    '  React.ComponentPropsWithoutRef<T>,',
    "  StylePropName | 'css' | 'colorMode' | 'variant'",
    '> & StyleProps & {',
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
