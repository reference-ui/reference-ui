// Theming for a published base system: extendSystem returns the same system with one override block
// appended to its own token stream, so a consumer restyles tokens without forking the base.
// It takes a base system and a token tree, checks every override against the tokens the base declares,
// and emits a plain BaseSystem carrying an unpublished `extended` marker. Under extends, that marker
// becomes one `extend:<base>` fragment node, which fragments.ts appends after the base's nodes.

import { isPlainObject, mergeTokenTree, tokenLeafPaths } from '../../collect/lib/merge.ts'
import type { ReferenceTokenConfig } from '../../collect/surface/tokens.ts'
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
// A rhythm word: an optional signed number or fraction, then the `r` unit (`r`, `2r`, `-1/3r`).
const RHYTHM_WORD = /^[+-]?(?:(?:\d+(?:\.\d+)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d+)?|\.\d+))?)?r$/
const WORD_BREAK = /[\s(),*]+/
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

// The engine's Portable selectors: the system's own [data-layer] stamp, with its light and dark modes.
function lightSelector(name: string): string {
  return `[data-layer="${name}"], [data-layer="${name}"][data-color-mode=light]`
}

function darkSelector(name: string): string {
  return `[data-layer="${name}"][data-color-mode=dark]`
}

function declaredNames(css: string): Set<string> {
  return new Set([...css.matchAll(DECLARATION)].flatMap((match) => (match[1] ? [match[1]] : [])))
}

// The names the base's own dark rule declares: a light-only override must replace these too.
function darkBlockNames(tokensPortable: string, name: string): Set<string> {
  const open = `${darkSelector(name)} {`
  const start = tokensPortable.indexOf(open)
  if (start < 0) return new Set()
  return declaredNames(tokensPortable.slice(start + open.length).split('}')[0] ?? '')
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

function scalarText(path: string, value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  throw new ExtendSystemError(`extendSystem: token ${path} must be a string or a number.`)
}

// A leaf replaces the whole token: light is `light ?? value`, and dark is `dark ?? light`.
function valuesOf(
  path: string,
  leaf: Record<string, unknown>
): { light: string; dark: string; explicitDark: boolean } {
  const lightValue = leaf.light ?? leaf.value
  if (lightValue === undefined || lightValue === null) {
    throw new ExtendSystemError(`extendSystem: token ${path} needs a value or a light value.`)
  }
  const light = scalarText(path, lightValue)
  const darkValue = leaf.dark
  const explicitDark = darkValue !== undefined && darkValue !== null
  return { light, dark: explicitDark ? scalarText(path, darkValue) : light, explicitDark }
}

// The v1 block prints token values as plain CSS, so a rhythm unit is refused rather than printed invalid.
function rejectRhythm(path: string, raw: string): void {
  const word = raw.split(WORD_BREAK).find((piece) => RHYTHM_WORD.test(piece))
  if (word === undefined) return
  throw new ExtendSystemError(
    `extendSystem: token ${path} uses the rhythm value "${word}", which extendSystem does not support yet.`
  )
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

function lowerValue(raw: string, owner: Owner, ctx: LowerContext): string {
  rejectRhythm(owner.path, raw)
  const lowered = raw.replace(BRACED_REF, (_match, inner: string) => referenceVar(inner, owner, ctx))
  if (/[{}]/.test(lowered)) throw malformed(owner.path)
  return lowered
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
 * system's [data-layer] stamps, then a dark rule when a leaf sets a dark value or replaces a base dark
 * value. A light-only rule would lose to the base's more specific dark rule, so that case prints one too.
 */
function overrideBlock(name: string, decls: readonly Decl[], baseDark: ReadonlySet<string>): string {
  if (decls.length === 0) return ''
  const lines = [
    '@layer tokens {',
    ...ruleLines(lightSelector(name), decls.map((decl) => [decl.cssName, decl.light] as const)),
  ]
  if (decls.some((decl) => decl.explicitDark || baseDark.has(decl.cssName))) {
    lines.push(...ruleLines(darkSelector(name), decls.map((decl) => [decl.cssName, decl.dark] as const)))
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
 * the result never stacks blocks. It throws ExtendSystemError for an unknown token, a self-reference, a
 * rhythm value, a leaf with no value, or a reference that the base does not declare.
 */
export function extendSystem(base: BaseSystem, overrides: ExtendSystemOverrides): BaseSystem {
  assertBaseSystem(base)
  const prior = extendedOf(base)
  const root = prior?.root ?? base
  const tokens = mergeTokenTree(prior?.tokens ?? {}, tokenTreeOf(overrides))
  const own = ownStream(root)
  const tokensPortable = own?.tokensPortable ?? ''
  const decls = declsOf(tokens, { base: root.name, declared: declaredNames(tokensPortable) })
  const block = overrideBlock(root.name, decls, darkBlockNames(tokensPortable, root.name))
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
