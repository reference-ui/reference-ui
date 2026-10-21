// Theming for a published base system: extendSystem appends one override block to its token stream.
// A consumer restyles tokens without forking the base. A leaf's value, light and dark slots resolve as
// the compiler's do. It takes a base system and a token tree, checks every override against the tokens
// the base declares, and emits a plain BaseSystem carrying an unpublished `extended` marker. The block
// claims the stamps the base's own token block claims: its own, then those of every system it extends.
// Under extends, the marker becomes one `extend:<base>` fragment node, appended after the base's nodes.

import { isPlainObject, mergeTokenTree, tokenLeafPaths } from '../../collect/lib/merge.ts'
import type { ReferenceTokenConfig } from '../../collect/surface/tokens.ts'
import { extendedSystemsOf } from './extended.ts'
import { lowerRhythm, SPACING_ROOT_VAR } from './rhythm.ts'
import type { BaseSystem, FragmentNode, SystemStreams } from './types.ts'

/** The overrides one call applies: a token tree shaped like the `tokens()` input. */
export interface ExtendSystemOverrides {
  tokens: ReferenceTokenConfig
}

/** A misuse of extendSystem, named after what is wrong with the call. */
export class ExtendSystemError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExtendSystemError'
  }
}

/** What an extended system remembers: its merged overrides, its name, and the original base it came from. */
interface ExtendMarker {
  from: string
  tokens: Record<string, unknown>
  root: BaseSystem
}

/** The override leaf being lowered: its dotted path and the custom property it prints as. */
interface Owner {
  path: string
  cssName: string
}

/** What a lowered value may name: the base's name for messages, and the custom properties it declares. */
interface LowerContext {
  base: string
  declared: ReadonlySet<string>
}

/** One override as the block prints it: the var name with its lowered light and dark values. */
interface Decl {
  cssName: string
  light: string
  dark: string
  explicitDark: boolean
}

const EXTENDED_KEY = 'extended'
const EXTEND_NODE_PREFIX = 'extend:'
const BRACED_REF = /\{([^{}]*)\}/g
const DECLARATION = /^\s*(--[^\s:]+)\s*:/gm

/** Kebab-cases one path segment as the engine does: each capital becomes a dash and its lowercase. */
function kebab(segment: string): string {
  return segment.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)
}

/** The custom property a dotted token path prints as: `colors.brand.ink` is `--colors-brand-ink`. */
function cssVarOf(path: string): string {
  return `--${path.split('.').map(kebab).join('-')}`
}

// The engine's Portable selectors: each stamp the base claims (its own first, then every system it
// extends), with its light and dark modes.
function lightSelector(stamps: readonly string[]): string {
  return stamps.map((name) => `[data-layer="${name}"], [data-layer="${name}"][data-color-mode=light]`).join(', ')
}

function darkSelector(stamps: readonly string[]): string {
  return stamps.map(darkStamp).join(', ')
}

function darkStamp(name: string): string {
  return `[data-layer="${name}"][data-color-mode=dark]`
}

// The stamps the base's own token block claims, in the engine's order.
function stampsOf(system: BaseSystem): string[] {
  return [system.name, ...extendedSystemsOf(system)]
}

function declaredNames(css: string): Set<string> {
  return new Set([...css.matchAll(DECLARATION)].flatMap((match) => (match[1] ? [match[1]] : [])))
}

// The names the base's own dark rule declares: a light-only override must replace these too. The rule
// opens with the base's own dark stamp, alone or ahead of the stamps of the systems it extends.
function darkBlockNames(tokensPortable: string, name: string): Set<string> {
  const start = tokensPortable.indexOf(darkStamp(name))
  if (start < 0) return new Set()
  const body = tokensPortable.slice(tokensPortable.indexOf('{', start) + 1)
  return declaredNames(body.split('}')[0] ?? '')
}

function ownStream(system: BaseSystem): SystemStreams | undefined {
  return system.streams?.find((stream) => stream.name === system.name)
}

function isExtendMarker(value: unknown): value is ExtendMarker {
  return (
    isPlainObject(value) &&
    typeof value.from === 'string' &&
    isPlainObject(value.tokens) &&
    typeof value.root === 'object' &&
    value.root !== null
  )
}

// The marker rides a non-enumerable property, so it never reaches a published JSON shape.
function extendedOf(system: BaseSystem): ExtendMarker | undefined {
  const value: unknown = Object.getOwnPropertyDescriptor(system, EXTENDED_KEY)?.value
  return isExtendMarker(value) ? value : undefined
}

function markExtended(system: BaseSystem, marker: ExtendMarker): BaseSystem {
  Object.defineProperty(system, EXTENDED_KEY, { value: marker, enumerable: false, configurable: true })
  return system
}

function assertBaseSystem(base: BaseSystem): void {
  if (typeof base !== 'object' || base === null || typeof base.name !== 'string') {
    throw new ExtendSystemError(
      'extendSystem: the first argument must be a published base system, such as a baseSystem export.'
    )
  }
}

function tokenTreeOf(overrides: ExtendSystemOverrides): Record<string, unknown> {
  const tokens: unknown = overrides?.tokens
  if (!isPlainObject(tokens)) {
    throw new ExtendSystemError('extendSystem: overrides need a `tokens` object shaped like tokens().')
  }
  return tokens
}

function leafAt(tree: Record<string, unknown>, path: string): Record<string, unknown> {
  let node: unknown = tree
  for (const key of path.split('.')) {
    node = isPlainObject(node) ? node[key] : undefined
  }
  return isPlainObject(node) ? node : {}
}

// The compiler reads token slots as strings only, so a number here would pass extendSystem and then fail sync.
function scalarText(path: string, value: unknown): string {
  if (typeof value === 'string') return value
  throw new ExtendSystemError(`extendSystem: token ${path} must be a string; write the number in quotes.`)
}

function slotOf(path: string, leaf: Record<string, unknown>, key: 'value' | 'light' | 'dark'): string | undefined {
  const slot = leaf[key]
  return slot === undefined || slot === null ? undefined : scalarText(path, slot)
}

interface ModeValues {
  light: string
  dark: string
  explicitDark: boolean
}

// Mirrors `pair_from_slots` in reference-rs base-system lower/mod.rs: `value` fills the mode the leaf does not
// name, and a leaf with one slot is its light value with no dark of its own. With two slots set, `single` is
// `value` whenever the leaf names only one mode, so `light ?? single` and `dark ?? single` give its pairs.
function pairOf(value?: string, light?: string, dark?: string): ModeValues | undefined {
  const single = value ?? light ?? dark
  if (single === undefined) return undefined
  const slots = [value, light, dark].filter((slot) => slot !== undefined).length
  if (slots < 2) return { light: single, dark: single, explicitDark: false }
  return { light: light ?? single, dark: dark ?? single, explicitDark: true }
}

// A one-slot leaf still replaces the whole token, so its dark is its light value wherever a dark rule must
// cover a base dark value.
function valuesOf(path: string, leaf: Record<string, unknown>): ModeValues {
  const values = pairOf(slotOf(path, leaf, 'value'), slotOf(path, leaf, 'light'), slotOf(path, leaf, 'dark'))
  if (values === undefined) {
    throw new ExtendSystemError(`extendSystem: token ${path} needs a value, a light value or a dark value.`)
  }
  return values
}

function malformed(path: string): ExtendSystemError {
  return new ExtendSystemError(`extendSystem: token ${path} has a brace that is not a {token.path} reference.`)
}

// A `{path}` reference lowers to var() only when the path is declared by the base and is not the owner.
function referenceVar(inner: string, owner: Owner, ctx: LowerContext): string {
  const path = inner.trim()
  if (path === '') throw malformed(owner.path)
  const cssName = cssVarOf(path)
  if (cssName === owner.cssName) {
    throw new ExtendSystemError(`extendSystem: token ${owner.path} references itself.`)
  }
  if (!ctx.declared.has(cssName)) {
    throw new ExtendSystemError(
      `extendSystem: token ${owner.path} refers to unknown token ${path} in ${ctx.base}.`
    )
  }
  return `var(${cssName})`
}

// Braces lower first, then rhythm units, as the compiler does. A rhythm value on the root would name the root
// inside its own definition, so the root refuses it.
function lowerValue(raw: string, owner: Owner, ctx: LowerContext): string {
  const lowered = raw.replace(BRACED_REF, (_match, inner: string) => referenceVar(inner, owner, ctx))
  if (/[{}]/.test(lowered)) throw malformed(owner.path)
  const resolved = lowerRhythm(lowered)
  if (resolved !== lowered && owner.cssName === SPACING_ROOT_VAR) {
    throw new ExtendSystemError(
      `extendSystem: token ${owner.path} defines the rhythm root in rhythm units ("${raw}"), which would reference itself.`
    )
  }
  return resolved
}

function declOf(path: string, leaf: Record<string, unknown>, ctx: LowerContext): Decl {
  const cssName = cssVarOf(path)
  if (!ctx.declared.has(cssName)) {
    throw new ExtendSystemError(
      `extendSystem: unknown token ${path} in ${ctx.base}; only tokens the base declares can be overridden.`
    )
  }
  const owner: Owner = { path, cssName }
  const values = valuesOf(path, leaf)
  return {
    cssName,
    light: lowerValue(values.light, owner, ctx),
    dark: lowerValue(values.dark, owner, ctx),
    explicitDark: values.explicitDark,
  }
}

function declsOf(tree: Record<string, unknown>, ctx: LowerContext): Decl[] {
  return tokenLeafPaths(tree).map((path) => declOf(path, leafAt(tree, path), ctx))
}

function ruleLines(selector: string, pairs: readonly (readonly [string, string])[]): string[] {
  return [`  ${selector} {`, ...pairs.map(([name, value]) => `    ${name}: ${value};`), '  }']
}

/**
 * The override block, printed the way the engine prints a Portable token layer: a light rule on the
 * stamps the base claims, then a dark rule holding each leaf that sets a dark value or replaces a base
 * dark value. A light-only rule would lose to the base's more specific dark rule, so that case prints one too;
 * a single-value leaf over a base token with no dark value prints no dark entry, as the compiler does.
 */
function overrideBlock(stamps: readonly string[], decls: readonly Decl[], baseDark: ReadonlySet<string>): string {
  if (decls.length === 0) return ''
  const lines = [
    '@layer tokens {',
    ...ruleLines(lightSelector(stamps), decls.map((decl) => [decl.cssName, decl.light] as const)),
  ]
  if (decls.some((decl) => decl.explicitDark || baseDark.has(decl.cssName))) {
    const darkDecls = decls.filter((decl) => decl.explicitDark || baseDark.has(decl.cssName))
    lines.push(...ruleLines(darkSelector(stamps), darkDecls.map((decl) => [decl.cssName, decl.dark] as const)))
  }
  lines.push('}', '')
  return lines.join('\n')
}

// Appends on a fresh line, so the block never joins the last rule of the text above it.
function appendText(text: string, block: string): string {
  const gap = text === '' || text.endsWith('\n') ? '' : '\n'
  return `${text}${gap}${block}`
}

// Only the own entry changes; every other entry stays the same object.
function streamsWithBlock(streams: readonly SystemStreams[], name: string, block: string): SystemStreams[] {
  const index = streams.findIndex((stream) => stream.name === name)
  if (block === '' || index < 0) return [...streams]
  return streams.map((stream, at) =>
    at === index ? { ...stream, tokensPortable: appendText(stream.tokensPortable ?? '', block) } : stream
  )
}

/**
 * Theme a published base system. The result keeps the base's name, fragments, jsxElements and
 * jsxOwned, and every stream entry is unchanged except the own entry, which gains one override block after its
 * tokens. A chained call merges its overrides with mergeTokenTree and re-emits from the original base, so
 * the result never stacks blocks. Braces and rhythm units lower to CSS as the compiler lowers them, so `2r`
 * prints `calc(2 * var(--spacing-root))`. It throws ExtendSystemError for an unknown token, a self-reference
 * (including a rhythm value on spacing.root), a leaf with no value, a malformed brace, or a reference that the
 * base does not declare.
 */
export function extendSystem(base: BaseSystem, overrides: ExtendSystemOverrides): BaseSystem {
  assertBaseSystem(base)
  const prior = extendedOf(base)
  const root = prior?.root ?? base
  const tokens = mergeTokenTree(prior?.tokens ?? {}, tokenTreeOf(overrides))
  const own = ownStream(root)
  const tokensPortable = own?.tokensPortable ?? ''
  const decls = declsOf(tokens, { base: root.name, declared: declaredNames(tokensPortable) })
  const block = overrideBlock(stampsOf(root), decls, darkBlockNames(tokensPortable, root.name))
  const result: BaseSystem = { ...root }
  if (root.streams) result.streams = streamsWithBlock(root.streams, root.name, block)
  return markExtended(result, { from: root.name, tokens, root })
}

/**
 * The one fragment node an extended system contributes under extends: its merged overrides as a token
 * call, named `extend:<base>` so the shadow warning stays silent on it. A plain base contributes none.
 */
export function extendFragmentNode(system: BaseSystem): FragmentNode | undefined {
  const marker = extendedOf(system)
  if (marker === undefined) return undefined
  return {
    name: `${EXTEND_NODE_PREFIX}${marker.from}`,
    bundle: `;tokens(${JSON.stringify(marker.tokens)})`,
  }
}
