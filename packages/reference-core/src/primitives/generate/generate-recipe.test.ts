// Type-level tests for the recipe declarations in the generated react types.
// They bake a system with one recipe, then run strict tsc over a wrapper probe that splits its props with splitVariantProps.
// The probe passes only when rest keeps the caller's other props (union members included) and drops the axis keys, when props with no axis
// key, generic wrappers or a recipe with no variants are accepted, when boolean, numeric and responsive values type-check (recipe breakpoints
// only), when a bare RecipeRuntimeFn splits into Partial halves, when a wrong value is rejected, that a generic wrapper over RecipeRuntimeFn<T> reads its call as a string, and that a recipe with `slots` returns one class string and one raw object per slot, typed by slot name.

import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { generateReactTypesSource } from './generate.ts'

const PACKAGE_ROOT = fileURLToPath(new URL('../../..', import.meta.url))

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const WRAPPER_PROBE = [
  "import type { ReactNode } from 'react'",
  "import { recipe, type RecipeConfig, type RecipeRuntimeFn } from './index.mjs'",
  "const card = recipe({ className: 'card', variants: { tone: { quiet: {}, loud: {} } } })",
  "type CardProps = { tone?: 'quiet' | 'loud'; className?: string; children?: ReactNode; id?: string }",
  'export function wrapper(props: CardProps) {',
  '  const [variants, rest] = card.splitVariantProps(props)',
  "  const tone: 'quiet' | 'loud' | undefined = variants.tone",
  '  const className: string | undefined = rest.className',
  '  const children: ReactNode = rest.children',
  '  // @ts-expect-error tone is split out of rest',
  '  rest.tone',
  '  return [tone, className, children, card(variants)]',
  '}',
  'export function noAxis(props: { className?: string }) {',
  '  const [, rest] = card.splitVariantProps(props)',
  '  return rest.className',
  '}',
  "export function badValue(props: { tone?: 'nope' }) {",
  '  // @ts-expect-error nope is not a tone option',
  '  return card.splitVariantProps(props)',
  '}',
  "// @ts-expect-error nope is not a tone option, plain or responsive",
  "card({ tone: { base: 'quiet', md: 'nope' } })",
  "type LinkOrButton = { tone?: 'loud'; as: 'a'; href: string } | { tone?: 'loud'; as: 'button'; onClick: () => void }",
  'export function union(props: LinkOrButton) {',
  '  const [, rest] = card.splitVariantProps(props)',
  "  if (rest.as === 'a') return rest.href",
  '  return rest.onClick',
  '}',
  "const plain = recipe({ className: 'plain', base: { color: 'red' } })",
  'export function noVariants(props: { children?: ReactNode; id?: string }) {',
  '  const [, rest] = plain.splitVariantProps(props)',
  '  const children: ReactNode = rest.children',
  '  return [children, rest.id]',
  '}',
  "const toggle = recipe({ className: 'toggle', variants: { on: { true: {}, false: {} }, disabled: { true: {} } } })",
  'export const booleans = [toggle({ on: true }), toggle({ on: false }), toggle({ on: \'true\' })]',
  'export function nativeBoolean(props: { disabled?: boolean; on?: boolean; title?: string }) {',
  '  const [variants, rest] = toggle.splitVariantProps(props)',
  '  return [toggle(variants), rest.title]',
  '}',
  "export const responsive = card({ tone: { base: 'quiet', md: 'loud' } })",
  "const [literal, literalRest] = card.splitVariantProps({ tone: 'loud', id: 'x' })",
  "export const literalCheck: ['loud', string] = [literal.tone, literalRest.id]",
  "// @ts-expect-error mdDown is a style-prop breakpoint, not a recipe one",
  "card({ tone: { base: 'quiet', mdDown: 'loud' } })",
  "export const recipeBreakpoints = card({ tone: { base: 'quiet', md: 'loud', lg: 'quiet' } })",
  "const cols = recipe({ className: 'cols', variants: { n: { 1: {}, 2: {} } } })",
  "export const numeric = [cols({ n: 1 }), cols({ n: '2' })]",
  "// @ts-expect-error 3 is not an n option",
  "cols({ n: 3 })",
  'export function genericWrapper<T extends CardProps>(props: T) {',
  '  const [variants, rest] = card.splitVariantProps(props)',
  '  return [card(variants), rest]',
  '}',
  "export function genericRecipeWrapper<T extends RecipeConfig>(fn: RecipeRuntimeFn<T>): string { const c: string = fn(); return c }",
  'export function bare(fn: RecipeRuntimeFn, props: { tone?: string; id?: string }) {',
  '  const [variants, rest] = fn.splitVariantProps(props)',
  '  const tone: string | undefined = variants.tone',
  '  const id: string | undefined = rest.id',
  '  return [tone, id]',
  '}',
  "export const responsiveBoolean = toggle({ on: { base: false, md: true } })",
]

const SLOT_PROBE = [
  "import { recipe, type RecipeRuntimeFn, type RecipeVariantProps } from './index.mjs'",
  'const card = recipe({',
  "  className: 'card',",
  "  slots: ['root', 'title', 'body'],",
  "  base: { root: { color: 'red' }, title: {} },",
  '  variants: {',
  '    size: { sm: { root: {} }, lg: { root: {}, title: {} } },',
  '    on: { true: { body: {} }, false: {} },',
  '  },',
  "  defaultVariants: { size: 'sm' },",
  "  compoundVariants: [{ size: 'lg', on: true, css: { title: {} } }],",
  '})',
  "const classes = card({ size: 'lg' })",
  'export const parts: [string, string, string] = [classes.root, classes.title, classes.body]',
  '// @ts-expect-error header is not a slot of card',
  'classes.header',
  '// @ts-expect-error a slotted call returns one class per slot, not a string',
  'export const flat: string = card()',
  "export const responsive: string = card({ size: { base: 'sm', md: 'lg' } }).root",
  'export const toggled: string = card({ on: true }).body',
  '// @ts-expect-error nope is not a size option',
  "card({ size: 'nope' })",
  "const raw = card.raw({ size: 'lg' })",
  'export const rawTitle: Record<string, unknown> = raw.title',
  '// @ts-expect-error header is not a slot of raw()',
  'raw.header',
  "export const variants: RecipeVariantProps<typeof card> = { size: 'lg', on: false }",
  "export function wrapper(props: { size?: 'sm' | 'lg'; id?: string }) {",
  '  const [selection, rest] = card.splitVariantProps(props)',
  '  const id: string | undefined = rest.id',
  '  return [card(selection).title, id]',
  '}',
  "const plain = recipe({ className: 'plain', base: { color: 'red' } })",
  'export const plainClass: string = plain()',
  "const wide = recipe({ className: 'wide', slots: ['a', 'b'] as string[] })",
  'export const wideClass: string = wide().anything',
  '// @ts-expect-error a slotted recipe is no bare RecipeRuntimeFn: its call returns an object',
  'export const bare: RecipeRuntimeFn = card',
]

describe('generateReactTypesSource recipe splitVariantProps under strict tsc', () => {
  it('types variants and rest for wrappers, unions, booleans, numbers and breakpoints', () => {
    const dir = probeDir('__recipe-split')
    writeFileSync(
      join(dir, 'index.d.mts'),
      generateReactTypesSource({ stylePropNames: ['color'], recipes: {}, role: 'none', recipeBreakpoints: ['md', 'lg'] })
    )
    writeFileSync(join(dir, 'probe.ts'), `${WRAPPER_PROBE.join('\n')}\n`)
    expect(checkProbe(dir)).toBe('')
  }, 150000)

  it('types one class string, and one raw object, per slot', () => {
    const dir = probeDir('__recipe-slots')
    writeFileSync(
      join(dir, 'index.d.mts'),
      generateReactTypesSource({ stylePropNames: ['color'], recipes: {}, role: 'none', recipeBreakpoints: ['md', 'lg'] })
    )
    writeFileSync(join(dir, 'probe.ts'), `${SLOT_PROBE.join('\n')}\n`)
    expect(checkProbe(dir)).toBe('')
  }, 150000)
})

/** A scratch project with a styled stub and react's real types linked in. */
function probeDir(name: string): string {
  const dir = join(PACKAGE_ROOT, 'tests', '.artifacts', `${name}-${process.pid}-${Date.now()}`)
  const styledDir = join(dir, 'node_modules', '@reference-ui', 'styled')
  mkdirSync(styledDir, { recursive: true })
  tempDirs.push(dir)
  writeFileSync(
    join(styledDir, 'package.json'),
    JSON.stringify({ name: '@reference-ui/styled', version: '0.0.0', types: './index.d.ts' })
  )
  writeFileSync(
    join(styledDir, 'index.d.ts'),
    [
      "export type StyleConditionKey = '_hover'",
      'export type StyleProps = { color?: unknown }',
      'export type SystemStyleObject = StyleProps & { [K in StyleConditionKey]?: SystemStyleObject }',
      '',
    ].join('\n')
  )
  mkdirSync(join(dir, 'node_modules', '@types'), { recursive: true })
  symlinkSync(join(PACKAGE_ROOT, 'node_modules', '@types', 'react'), join(dir, 'node_modules', '@types', 'react'), 'dir')
  return dir
}

/** Strict tsc over probe.ts with declarations checked; returns the diagnostics, empty when clean. */
function checkProbe(dir: string): string {
  const tsc = join(PACKAGE_ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
  const args = [tsc, '--ignoreConfig', '--noEmit', '--strict', '--target', 'ES2022', '--lib', 'ES2022,DOM']
  args.push('--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--types', 'react', 'probe.ts')
  try {
    execFileSync(process.execPath, args, { cwd: dir, stdio: 'pipe', timeout: 120000 })
    return ''
  } catch (error) {
    const failure = error as { stdout?: unknown; stderr?: unknown }
    return `${String(failure.stdout ?? '')}${String(failure.stderr ?? '')}`
  }
}
