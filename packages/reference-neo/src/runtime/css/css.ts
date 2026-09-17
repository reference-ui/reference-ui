// Authored css() over natively compiled style plans.
// It takes style objects and emits the resolved utility class string.
// Conditions nest verbatim into lookup whens while misses resolve to nothing.
// A miss also warns once in dev, naming the value, the prop, and the call site.

import type { NativeRuntimeArtifact, RuntimeDeclaration } from '@reference-ui/rust/contracts'
import { lowerResponsiveStyles } from './lowerResponsiveStyles.ts'
import {
  createStylePlanIndex,
  findStylePlanMisses,
  mergeStylePlans,
  serializeCanonicalJson,
  type StylePlanQuery,
} from './plans.ts'

/** Author style object: flat declarations plus nested conditions. */
export type SystemStyleObject = Record<string, unknown>

/** One css() input: a style object, a list of them, or a conditional skip. */
export type CssStyles = SystemStyleObject | undefined | null | false

interface ActiveRuntime {
  system: string
  index: Map<string, RuntimeDeclaration[]>
  styleProps: Set<string>
}

let active: ActiveRuntime | undefined

/** Miss diagnostics already reported this session; repeats stay silent. */
const reportedMissDiagnostics = new Set<string>()

function isProductionBuild(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.env !== 'undefined' &&
    process.env.NODE_ENV === 'production'
  )
}

/**
 * Frames belonging to this runtime, skipped while locating the css() caller.
 * Function names survive the unminified world bundle; the file markers cover
 * minified builds and the Firefox `fn@file` frame shape.
 */
const INTERNAL_STACK_FRAME =
  /captureMissSite\b|reportStyleMisses\b|collectEntries\b|collectStyle\b|[^A-Za-z_$]css\s*\(|runtime\/css\/css\.ts|react\.mjs/

function captureMissSite(): string {
  const stack = new Error().stack ?? ''
  for (const line of stack.split('\n').slice(1)) {
    const trimmed = line.trim()
    if (trimmed === '' || INTERNAL_STACK_FRAME.test(trimmed)) {
      continue
    }
    return trimmed.replace(/^at\s+/, '')
  }
  return '(unknown call site)'
}

function formatMissTarget(query: StylePlanQuery): string {
  const leaf = `${query.prop}: ${serializeCanonicalJson(query.value)}`
  const when = query.when ?? []
  return when.length > 0 ? `${when.join(' > ')} > ${leaf}` : leaf
}

/**
 * Warn once per missed declaration in dev. Holes and conditional skips never
 * reach here (collect drops them), so every miss is a value with no compiled
 * atom: a dynamic value, a typo, or a missing staticCss entry.
 */
function reportStyleMisses(queries: StylePlanQuery[]): void {
  if (isProductionBuild() || !active) {
    return
  }
  const misses = findStylePlanMisses(active.index, queries)
  if (misses.length === 0) {
    return
  }
  const site = captureMissSite()
  for (const miss of misses) {
    const message =
      `[reference-ui] css(): no compiled class for \`${formatMissTarget(miss)}\` ` +
      `(called at ${site}). Add a static call site or staticCss entry; no class emitted.`
    if (reportedMissDiagnostics.has(message)) {
      continue
    }
    reportedMissDiagnostics.add(message)
    console.warn(message)
  }
}

/**
 * Register the compiled plans css() resolves against. Sync calls this once
 * per generated bundle with the compiling system's name and artifact; later
 * registrations replace earlier ones (single-system runtime for now).
 */
export function registerRuntimeData(system: string, artifact: NativeRuntimeArtifact): void {
  active = { system, index: createStylePlanIndex(artifact), styleProps: new Set(artifact.stylePropNames) }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stripImportantSuffix(val: string): string | null {
  const MARKER = '!important'
  if (val.length < MARKER.length) return null
  const tail = val.slice(val.length - MARKER.length)
  if (tail.toLowerCase() === MARKER) {
    return val.slice(0, val.length - MARKER.length)
  }
  return null
}

function splitImportant(value: unknown): { clean: unknown; important: boolean } {
  if (typeof value === 'string') {
    const stripped = stripImportantSuffix(value)
    if (stripped !== null) {
      return { clean: stripped.trimEnd(), important: true }
    }
    if (value.length > 1 && value.endsWith('!')) {
      return { clean: value.slice(0, -1), important: true }
    }
  }
  return { clean: value, important: false }
}

function isHole(value: unknown): boolean {
  return value === null || value === undefined || value === false
}

/**
 * Clean a per-prop responsive object (`width: { base, md }`) into its plan
 * lookup value. Mirrors the engine authored value: leaf `!` markers strip
 * and the object itself is never important, so the query below always runs
 * non-important.
 */
function cleanResponsiveObject(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    cleaned[key] = typeof value === 'string' ? splitImportant(value).clean : value
  }
  return cleaned
}

interface CollectContext {
  system: string
  styleProps: Set<string>
  queries: StylePlanQuery[]
}

function collectEntries(obj: Record<string, unknown>, ctx: CollectContext, when: string[]): void {
  const { system, styleProps, queries } = ctx
  for (const [prop, value] of Object.entries(obj)) {
    if (isObject(value)) {
      if (prop !== 'r' && styleProps.has(prop)) {
        queries.push({ system, when, prop, value: cleanResponsiveObject(value), important: false })
        continue
      }
      collectEntries(value, ctx, [...when, prop])
      continue
    }
    if (isHole(value)) {
      continue
    }
    const { clean, important } = splitImportant(value)
    queries.push({ system, when, prop, value: clean, important })
  }
}

function collectStyle(
  style: CssStyles | CssStyles[],
  system: string,
  styleProps: Set<string>,
  queries: StylePlanQuery[]
): void {
  if (Array.isArray(style)) {
    for (const item of style) collectStyle(item, system, styleProps, queries)
    return
  }
  if (!isObject(style)) return
  collectEntries(lowerResponsiveStyles(style), { system, styleProps, queries }, [])
}

/**
 * Resolve style objects to utility classes from the registered plans.
 * Accepts objects, lists, and conditional skips; unknown declarations
 * resolve to nothing (plus one dev diagnostic each), per-prop responsive
 * objects resolve as one value, and shared slots collapse
 * important-beats-plain then last-wins with same-family eviction.
 */
export function css(...styles: Array<CssStyles | CssStyles[]>): string {
  if (!active) {
    throw new Error('css() called before registerRuntimeData: sync the project first')
  }
  const queries: StylePlanQuery[] = []
  for (const style of styles) collectStyle(style, active.system, active.styleProps, queries)
  const classes = mergeStylePlans(active.index, queries)
  reportStyleMisses(queries)
  return classes
}
