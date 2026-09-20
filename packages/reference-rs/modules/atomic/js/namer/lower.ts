/**
 * Lowering interpreter over `NamerTables.lowerings`, per the ask-8 normative
 * semantics: canonicalize, run the ordered steps with guards on the rendered
 * value, first match runs. Mirrors `resolve/mod.rs::lower_macro` plus
 * `resolve/shorthands::expand_shorthand` (macro, then pair, flex, border,
 * dimensional) with the `unrealizable` fall-through when no lowering claims
 * the prop. `pair`/`emit`/`macro`/`keep`/`drop` apply to all value kinds;
 * `trbl`/`trio`/`rewrite` terminate to identity for token/bool/null.
 */
import type { LowerStep, NamerGuard, NamerTables } from '../../../../contracts/types.js'
import { trimStructural } from './lexical.js'
import {
  classifyTrioTokens,
  isGlobalKeyword,
  isWholeBorderValue,
  splitTokens,
} from './shorthand.js'
import type { NamerValue } from './value.js'

/** Fixed 2/3/4-token to TRBL mapping, confirmed in `dimensional.rs`. */
const TRBL_INDEX: Record<number, [number, number, number, number]> = {
  2: [0, 1, 0, 1],
  3: [0, 1, 2, 1],
  4: [0, 1, 2, 3],
}

/** Props whose `$` emits clone the value kind (`size.rs`, `gradient.rs`); every other `$` stringifies the rendering (`container.rs`). */
const CLONE_EMIT_PROPS = new Set(['size', 'textGradient'])

/** One lowered declaration: prop plus value form. */
export type LoweredPair = [string, NamerValue]

/** Pass state for one prop/value lowering. */
interface LowerContext {
  orig: string
  canon: string
  value: NamerValue
  tables: NamerTables
  rendered: string
}

/** Render one value to its `class_name_str` spelling for guards and `$`. */
function renderValue(value: NamerValue): string {
  if (value.kind === 'string') return value.text
  if (value.kind === 'number') return String(value.num)
  if (value.kind === 'token') return value.path
  if (value.kind === 'boolean') return value.flag ? 'true' : 'false'
  return 'null'
}

/**
 * Lower one canonical prop/value through its ordered steps. Missing lowering
 * falls to the `unrealizable` refusal, else identity; a matched step runs and
 * later steps never do. (Only `textGradient` pairs a lowering with the
 * unrealizable set, and its emit is unguarded, so fall-through order is moot.)
 */
export function interpretLowering(
  origProp: string,
  canon: string,
  value: NamerValue,
  tables: NamerTables
): LoweredPair[] {
  const steps = tables.lowerings[canon]
  if (steps === undefined) {
    if ((tables.keywords['unrealizable'] ?? []).includes(canon)) return []
    return [[origProp, value]]
  }
  const ctx: LowerContext = { orig: origProp, canon, value, tables, rendered: renderValue(value) }
  for (const step of steps) {
    const hit = runStep(step, ctx)
    if (hit !== undefined) return hit
  }
  return [[origProp, value]]
}

/** Run one step: guard miss yields undefined, a hit runs to pairs. */
function runStep(step: LowerStep, ctx: LowerContext): LoweredPair[] | undefined {
  if ('drop' in step) return []
  if (!guardPasses(step.on, ctx)) return undefined
  if ('keep' in step) return keepPairs(ctx)
  if ('macro' in step) return macroPairs(step.macro, ctx)
  if ('emit' in step) return emitPairs(step.emit, ctx)
  if ('rewrite' in step) return rewritePairs(step.rewrite, ctx)
  if ('shape' in step) return shapePairs(step, ctx)
  return [[ctx.orig, ctx.value]]
}

/** Guards evaluate on the rendered value, trimmed unless the step opts out; absent guard passes. */
function guardPasses(on: NamerGuard | undefined, ctx: LowerContext): boolean {
  if (on === undefined) return true
  if (typeof on === 'string') return namedGuardPasses(on, ctx)
  const trimmed = trimStructural(ctx.rendered)
  if ('eq' in on) return (on.trimmed === false ? ctx.rendered : trimmed) === on.eq
  return (ctx.tables.keywords[on.in] ?? []).includes(trimmed)
}

/** Named value-kind predicates: boolean-true, empty rendering, whole value (exact `none` included). */
function namedGuardPasses(on: string, ctx: LowerContext): boolean {
  if (on === 'bool:true') return ctx.value.kind === 'boolean' && ctx.value.flag
  if (on === 'empty') return ctx.rendered === ''
  const trimmed = trimStructural(ctx.rendered)
  return trimmed === 'none' || isWholeBorderValue(trimmed, ctx.tables)
}

/**
 * Identity-terminate: strings and numbers keep the canonical prop with the
 * trimmed rendering; token/bool/null pass through kind-preserved, matching
 * the expansion `?` the whole arm sits behind.
 */
function keepPairs(ctx: LowerContext): LoweredPair[] {
  if (ctx.value.kind === 'string' || ctx.value.kind === 'number') {
    return [[ctx.canon, { kind: 'string', text: trimStructural(ctx.rendered) }]]
  }
  return [[ctx.orig, ctx.value]]
}

/** System-data macros through the fonts table. */
function macroPairs(macro: 'font' | 'weight', ctx: LowerContext): LoweredPair[] {
  return macro === 'font' ? fontPairs(ctx) : weightPairs(ctx)
}

/**
 * `font`: family, then default weight, then ordered extras. Later keys
 * overwrite earlier with first-insertion position kept (`IndexMap`
 * semantics, mirrored with `Map`). Unknown names stamp family only.
 */
function fontPairs(ctx: LowerContext): LoweredPair[] {
  const pairs = new Map<string, NamerValue>()
  pairs.set('fontFamily', { kind: 'string', text: ctx.rendered })
  const def = ctx.tables.fonts[ctx.rendered]
  if (def !== undefined) {
    pairs.set('fontWeight', { kind: 'string', text: def.weight })
    for (const [prop, val] of def.css) pairs.set(prop, { kind: 'string', text: val })
  }
  return [...pairs.entries()].map(([prop, val]): LoweredPair => [prop, val])
}

/** `weight`: scoped scale, else keyword table, else raw. */
function weightPairs(ctx: LowerContext): LoweredPair[] {
  const raw = ctx.rendered
  const mapped = scopedWeight(raw, ctx.tables) ?? keywordWeight(raw, ctx.tables) ?? raw
  return [['fontWeight', { kind: 'string', text: mapped }]]
}

/** Named weight from a scoped `family.weight` key. */
function scopedWeight(raw: string, tables: NamerTables): string | undefined {
  const dot = raw.indexOf('.')
  if (dot < 0) return undefined
  return tables.fonts[raw.slice(0, dot)]?.weights[raw.slice(dot + 1)]
}

/** CSS weight keyword from the ordered pairs table. */
function keywordWeight(raw: string, tables: NamerTables): string | undefined {
  for (const [name, val] of tables.weightKeywords) {
    if (name === raw) return val
  }
  return undefined
}

/** Emit declarations: literals, or `$` for the rendered value. */
function emitPairs(emit: Array<[string, string]>, ctx: LowerContext): LoweredPair[] {
  return emit.map(([prop, lit]): LoweredPair => [
    prop,
    lit === '$' ? dollarValue(ctx) : { kind: 'string', text: lit },
  ])
}

/** `$` clones the value kind for size/textGradient, else stringifies. */
function dollarValue(ctx: LowerContext): NamerValue {
  if (CLONE_EMIT_PROPS.has(ctx.canon)) return ctx.value
  return { kind: 'string', text: ctx.rendered }
}

/** Rewrite one trimmed value; misses and non-strings terminate to identity. */
function rewritePairs(rewrite: Record<string, string>, ctx: LowerContext): LoweredPair[] {
  const identity: LoweredPair[] = [[ctx.orig, ctx.value]]
  if (ctx.value.kind !== 'string' && ctx.value.kind !== 'number') return identity
  const mapped = rewrite[trimStructural(ctx.rendered)]
  if (mapped === undefined) return identity
  return [[ctx.canon, { kind: 'string', text: mapped }]]
}

/** Fan out to longhands by shape. */
function shapePairs(
  step: Extract<LowerStep, { shape: unknown }>,
  ctx: LowerContext
): LoweredPair[] {
  if (step.shape === 'pair') return pairPairs(step.longhands, ctx)
  if (ctx.value.kind !== 'string' && ctx.value.kind !== 'number') {
    return [[ctx.orig, ctx.value]]
  }
  if (step.shape === 'trio') return trioPairs(step.longhands, step.style, ctx)
  return trblPairs(step.longhands, ctx)
}

/** Pair fan-out clones the value kind to both corners. */
function pairPairs(
  longhands: [string, string],
  ctx: LowerContext
): LoweredPair[] {
  return [
    [longhands[0], ctx.value],
    [longhands[1], ctx.value],
  ]
}

/** TRBL fan-out over 2-4 tokens; anything else terminates to identity. */
function trblPairs(
  longhands: [string, string, string, string],
  ctx: LowerContext
): LoweredPair[] {
  const identity: LoweredPair[] = [[ctx.orig, ctx.value]]
  const trimmed = trimStructural(ctx.rendered)
  if (isGlobalKeyword(trimmed, ctx.tables)) return identity
  const tokens = splitTokens(trimmed)
  const picks = TRBL_INDEX[tokens.length]
  if (picks === undefined) return identity
  return longhands.map((prop, index): LoweredPair => [
    prop,
    { kind: 'string', text: tokens[picks[index] ?? 0] ?? '' },
  ])
}

/** Trio fan-out: split, classify, build width/style/color in emit order. */
function trioPairs(
  longhands: [string, string, string],
  style: 'border' | 'outline',
  ctx: LowerContext
): LoweredPair[] {
  const identity: LoweredPair[] = [[ctx.orig, ctx.value]]
  const tokens = splitTokens(trimStructural(ctx.rendered))
  if (tokens.length === 0) return identity
  const parsed = classifyTrioTokens(tokens, style === 'outline', ctx.tables)
  const pairs: LoweredPair[] = []
  if (parsed.width !== null) {
    pairs.push([longhands[0], { kind: 'string', text: parsed.width }])
  }
  if (parsed.style !== null) {
    pairs.push([longhands[1], { kind: 'string', text: parsed.style }])
  }
  if (parsed.color !== null) {
    pairs.push([longhands[2], { kind: 'string', text: parsed.color }])
  }
  return pairs.length === 0 ? identity : pairs
}
