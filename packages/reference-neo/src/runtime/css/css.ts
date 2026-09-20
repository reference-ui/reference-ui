// Authored css() over the runtime namer.
// It takes style objects and emits the constructed utility class string.
// Conditions nest verbatim into whens while misses still construct a class.
// A miss class with no rule paints nothing and warns once in dev, naming the value, the prop, and the call site.

import type { NamerTables, NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import {
  name,
  NAMER_RULES_VERSION,
  reportMissCandidates,
  type MissCandidate,
  type NamerRequest,
} from '@reference-ui/rust/namer'
import { lowerResponsiveStyles } from './lowerResponsiveStyles.ts'
import {
  mergeStylePlans,
  serializeCanonicalJson,
  type ScoredDeclaration,
} from './plans.ts'

/** Author style object: flat declarations plus nested conditions. */
export type SystemStyleObject = Record<string, unknown>

/** One css() input: a style object, a list of them, or a conditional skip. */
export type CssStyles = SystemStyleObject | undefined | null | false

interface ActiveRuntime {
  system: string
  tables: NamerTables
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

function formatMissTarget(query: NamerRequest): string {
  const leaf = `${query.prop}: ${serializeCanonicalJson(query.value)}`
  return query.when.length > 0 ? `${query.when.join(' > ')} > ${leaf}` : leaf
}

/**
 * Queue one dev diagnostic per constructed class the sheet may not back.
 * Holes and conditional skips never reach here (collect drops them), and
 * refused queries name nothing to check, so every candidate is a class the
 * probe confirms against `@layer utilities`: a dynamic value, a typo, or a
 * missing staticCss entry. Node stays silent (no document); the probe warns.
 */
function reportStyleMisses(named: Array<{ query: NamerRequest; classes: string[] }>): void {
  if (isProductionBuild()) {
    return
  }
  const candidates: MissCandidate[] = []
  let site: string | undefined
  for (const { query, classes } of named) {
    for (const className of classes) {
      site ??= captureMissSite()
      const message =
        `[reference-ui] css(): no compiled class for \`${formatMissTarget(query)}\` ` +
        `(called at ${site}). Add a static call site or staticCss entry; miss class emitted but unbacked, paints nothing.`
      if (reportedMissDiagnostics.has(message)) {
        continue
      }
      reportedMissDiagnostics.add(message)
      candidates.push({ className, message })
    }
  }
  reportMissCandidates(candidates)
}

/**
 * Register the namer tables css() constructs classes with. Sync calls this
 * once per generated bundle with the compiling system's name and artifact;
 * later registrations replace earlier ones (single-system runtime for now).
 * The system name threads into every name() call below, and the artifact's
 * rules version must equal the runtime namer's or registration throws.
 */
export function registerRuntimeData(system: string, artifact: NativeRuntimeArtifact): void {
  if (artifact.schemaVersion !== 2) {
    throw new Error(
      `registerRuntimeData: schemaVersion ${artifact.schemaVersion} is not 2 — sync the project first`
    )
  }
  if (artifact.namer.rulesVersion !== NAMER_RULES_VERSION) {
    throw new Error(
      `registerRuntimeData: namer rulesVersion ${artifact.namer.rulesVersion} does not match ` +
        `the runtime namer's ${NAMER_RULES_VERSION} — sync with the matching @reference-ui/rust`
    )
  }
  active = { system, tables: artifact.namer, styleProps: new Set(artifact.stylePropNames) }
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
 * Clean a per-prop responsive object (`width: { base, md }`) into its namer
 * value. Mirrors the engine authored value: leaf `!` markers strip and the
 * object itself is never important, so the request below always runs
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
  styleProps: Set<string>
  queries: NamerRequest[]
}

function collectEntries(obj: Record<string, unknown>, ctx: CollectContext, when: string[]): void {
  const { styleProps, queries } = ctx
  for (const [prop, value] of Object.entries(obj)) {
    if (isObject(value)) {
      // Custom props are open-ended style positions (canon `--*`
      // authority), never conditions — mirrored in analysis.
      if (prop !== 'r' && (styleProps.has(prop) || prop.startsWith('--'))) {
        queries.push({ when, prop, value: cleanResponsiveObject(value), important: false })
        continue
      }
      collectEntries(value, ctx, [...when, prop])
      continue
    }
    if (isHole(value)) {
      continue
    }
    const { clean, important } = splitImportant(value)
    queries.push({ when, prop, value: clean, important })
  }
}

function collectStyle(
  style: CssStyles | CssStyles[],
  styleProps: Set<string>,
  queries: NamerRequest[]
): void {
  if (Array.isArray(style)) {
    for (const item of style) collectStyle(item, styleProps, queries)
    return
  }
  if (!isObject(style)) return
  collectEntries(lowerResponsiveStyles(style), { styleProps, queries }, [])
}

/**
 * Resolve style objects to constructed utility classes from the registered
 * namer tables. Accepts objects, lists, and conditional skips; refused
 * declarations name nothing (plus no diagnostic — there is no class to
 * probe), per-prop responsive objects name as one value, and shared slots
 * collapse important-beats-plain then last-wins with same-family eviction.
 */
export function css(...styles: Array<CssStyles | CssStyles[]>): string {
  if (!active) {
    throw new Error('css() called before registerRuntimeData: sync the project first')
  }
  const queries: NamerRequest[] = []
  for (const style of styles) collectStyle(style, active.styleProps, queries)
  const scored: ScoredDeclaration[] = []
  const named: Array<{ query: NamerRequest; classes: string[] }> = []
  for (const query of queries) {
    const classes: string[] = []
    for (const decl of name(query, active.tables, active.system)) {
      scored.push({ decl, important: query.important })
      classes.push(decl.className)
    }
    named.push({ query, classes })
  }
  const classes = mergeStylePlans(scored)
  reportStyleMisses(named)
  return classes
}
