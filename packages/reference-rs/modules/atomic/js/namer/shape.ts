/**
 * Shaping procedure P9 plus the composed single-declaration build the golden
 * pins. Mirrors `runtime/builder.rs::resolve_entry` (arrays dispatch by
 * index, per-prop objects by breakpoint-or-nested key, `$token` to path,
 * `$r` through the collapse fence, silent skips for nulls, beyond-scale
 * indices, and malformed forms) with `stylesheet::name`'s join. Pins golden
 * `15-shape`. No build-dedupe: `css()` has no dedupe and the differential
 * calls per declaration, so dedupe stays deleted with the map.
 */
import type { NamerTables } from '../../../../contracts/types.js'
import { collapseRNumber, sanitizeValue } from './lexical.js'
import { interpretLowering } from './lower.js'
import { deriveSlotParts } from './slot.js'
import { canonicalProp, scalarStem, type NamerValue } from './value.js'
import { lowerCondition } from './when.js'

/** One authored declaration: the request the namer spells. */
export interface NamerRequest {
  when: string[]
  prop: string
  value: unknown
  important: boolean
}

/** One named declaration: cascade slot plus system-qualified class. */
export interface NamerDeclaration {
  slot: string
  className: string
}

/** Vendor prefixes that take a leading dash in the kebab fallback. */
const VENDOR_PREFIXES = ['moz', 'webkit', 'ms', 'o']

/** Pass state for one declaration build. */
interface BuildContext {
  tables: NamerTables
  system: string
  important: boolean
}

/** One scalar member: prop, value, condition whens, and slot coordinates. */
interface MemberInput {
  prop: string
  value: unknown
  condWhen: string[]
  slotWhen: string[]
  slotBp: string | undefined
}

/**
 * P9 golden: spell one authored declaration to slot/className pairs. Arrays
 * fan out by scale index, objects by responsive-or-nested key, scalars run
 * the lower-then-name pipeline; refusals drop per declaration.
 */
export function shape(
  input: NamerRequest,
  tables: NamerTables,
  system = ''
): NamerDeclaration[] {
  const ctx: BuildContext = { tables, system, important: input.important }
  if (Array.isArray(input.value)) return shapeArray(input, ctx)
  if (isPerPropObject(input.value)) return shapeObject(input, input.value, ctx)
  const scalar: MemberInput = {
    prop: input.prop,
    value: input.value,
    condWhen: input.when,
    slotWhen: input.when,
    slotBp: undefined,
  }
  return shapeMember(scalar, ctx)
}

/** True for a per-prop object: no `$r` and no `$token` key. */
function isPerPropObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return !('$r' in value) && !('$token' in value)
}

/** Responsive array: index to breakpoint name, nulls and beyond-scale skip. */
function shapeArray(input: NamerRequest, ctx: BuildContext): NamerDeclaration[] {
  const out: NamerDeclaration[] = []
  const scale = ctx.tables.breakpoints
  const members = input.value as unknown[]
  for (let index = 0; index < members.length; index += 1) {
    const elem = members[index]
    if (elem === null || elem === undefined) continue
    const bp = scale[index]
    if (bp === undefined) continue
    const stepWhen = [...input.when, bp]
    const member: MemberInput = {
      prop: input.prop,
      value: elem,
      condWhen: stepWhen,
      slotWhen: input.when,
      slotBp: bp,
    }
    out.push(...shapeMember(member, ctx))
  }
  return out
}

/** Per-prop object in author order: breakpoints join `@bp`, other keys nest `when`. */
function shapeObject(
  input: NamerRequest,
  map: Record<string, unknown>,
  ctx: BuildContext
): NamerDeclaration[] {
  const out: NamerDeclaration[] = []
  for (const [key, elem] of Object.entries(map)) {
    if (elem === null || elem === undefined) continue
    const stepWhen = [...input.when, key]
    if (key === 'base' || ctx.tables.breakpoints.includes(key)) {
      const member: MemberInput = {
        prop: input.prop,
        value: elem,
        condWhen: stepWhen,
        slotWhen: input.when,
        slotBp: key,
      }
      out.push(...shapeMember(member, ctx))
    } else {
      const member: MemberInput = {
        prop: input.prop,
        value: elem,
        condWhen: stepWhen,
        slotWhen: stepWhen,
        slotBp: undefined,
      }
      out.push(...shapeMember(member, ctx))
    }
  }
  return out
}

/**
 * One scalar member: convert, lower conditions (an unknown entry drops the
 * whole want), interpret lowerings, then name each declaration. Refusal
 * granularity is per declaration.
 */
function shapeMember(member: MemberInput, ctx: BuildContext): NamerDeclaration[] {
  const atom = convertValue(member.value)
  if (atom === undefined) return []
  const segments = lowerConditions(member.condWhen, ctx.tables)
  if (segments === undefined) return []
  const canon = canonicalProp(member.prop, ctx.tables)
  const pairs = interpretLowering(member.prop, canon, atom, ctx.tables)
  const out: NamerDeclaration[] = []
  for (const [longProp, longVal] of pairs) {
    const longCanon = canonicalProp(longProp, ctx.tables)
    const verdict = scalarStem(longCanon, longVal, ctx.tables)
    if (!('stem' in verdict)) continue
    out.push({
      slot: deriveSlotParts(longCanon, member.slotWhen, member.slotBp),
      className: classNameWithSystem(longCanon, verdict.stem, segments, ctx),
    })
  }
  return out
}

/** Lower every `when` entry to segments; unknown drops the want. */
function lowerConditions(condWhen: string[], tables: NamerTables): string[] | undefined {
  const segments: string[] = []
  for (const raw of condWhen) {
    const lowered = lowerCondition(raw, tables)
    if (lowered.status === 'unknown') return undefined
    if (lowered.status === 'known') segments.push(lowered.segment)
  }
  return segments
}

/** Plan-JSON value to resolve input, with `$r` fence refusals as skips. */
function convertValue(value: unknown): NamerValue | undefined {
  if (typeof value === 'string') return { kind: 'string', text: value }
  if (typeof value === 'number') return { kind: 'number', num: value }
  if (typeof value === 'boolean') return { kind: 'boolean', flag: value }
  if (value === null) return { kind: 'null' }
  if (typeof value !== 'object' || Array.isArray(value)) return undefined
  const map = value as Record<string, unknown>
  if ('$token' in map) return tokenValue(map['$token'])
  return rValue(map['$r'])
}

/** A `$token` object back to its path, or undefined unless exactly `{"path": str, "value": str}`. */
function tokenValue(inner: unknown): NamerValue | undefined {
  if (typeof inner !== 'object' || inner === null || Array.isArray(inner)) return undefined
  const map = inner as Record<string, unknown>
  const path = map['path']
  const val = map['value']
  if (typeof path !== 'string' || typeof val !== 'string') return undefined
  return { kind: 'token', path }
}

/** An `$r` object back to its multiplier string, or undefined when missing or fenced. */
function rValue(rVal: unknown): NamerValue | undefined {
  if (rVal === undefined) return undefined
  if (typeof rVal === 'number') {
    const multiplier = collapseRNumber(rVal)
    if (multiplier === undefined) return undefined
    return { kind: 'string', text: multiplier + 'r' }
  }
  return { kind: 'string', text: JSON.stringify(rVal) + 'r' }
}

/** Join: prefix, sanitized stem, `!`, condition segments, system qualifier. */
function classNameWithSystem(
  canon: string,
  stem: string,
  segments: string[],
  ctx: BuildContext
): string {
  const prefix = classPrefix(canon, ctx.tables)
  const base = ctx.important
    ? prefix + '_' + sanitizeValue(stem) + '!'
    : prefix + '_' + sanitizeValue(stem)
  const stemmed = segments.length === 0 ? base : segments.join(':') + ':' + base
  return ctx.system === '' ? stemmed : ctx.system + '__' + stemmed
}

/** Class prefix: table hit, then `--*` verbatim, then the kebab fallback. */
function classPrefix(canon: string, tables: NamerTables): string {
  return tables.prefixes[canon] ?? (canon.startsWith('--') ? canon : kebabCase(canon))
}

/** camelCase to kebab with a leading dash for vendor-prefixed names. */
function kebabCase(name: string): string {
  let out = isVendorPrefixed(name) ? '-' : ''
  for (let index = 0; index < name.length; index += 1) {
    const code = name.charCodeAt(index)
    if (code >= 0x41 && code <= 0x5a) {
      out += (index > 0 ? '-' : '') + String.fromCharCode(code + 0x20)
    } else {
      out += name[index]
    }
  }
  return out
}

/** True when the name opens with a vendor prefix plus an uppercase letter. */
function isVendorPrefixed(name: string): boolean {
  return VENDOR_PREFIXES.some(
    prefix =>
      name.length > prefix.length &&
      name.startsWith(prefix) &&
      isAsciiUpper(name.charCodeAt(prefix.length))
  )
}

/** True for ASCII `A`-`Z`. */
function isAsciiUpper(code: number): boolean {
  return code >= 0x41 && code <= 0x5a
}
