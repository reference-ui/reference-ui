/**
 * Harvest M-series model: the Method recipe from the harvest mission brief
 * (docs/missions) as a deterministic builder. Takes the pool size (300/500)
 * plus a `when` list and
 * emits the class count, the sheet, and its gzip-6/brotli-11 bytes. Sink tables are
 * parsed from the Rust sources (never typed in); the four ready-05 pinned readings
 * (spaceless rgba, 0-based url/transform, kebab `focus-visible`, short disabled
 * wrap) are baked in. The last two differ from the real compiler on purpose: the
 * `when`-variant rows are counterfactuals nobody plans around, and the test pins
 * the mission table to prove this builder matches it byte for byte.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CANON = path.resolve(HERE, '..', '..', 'canon', 'src')
const VALIDITY = path.resolve(
  HERE,
  '..',
  'src',
  'extract',
  'harvest',
  'mint',
  'validity.rs'
)

export type ModelWhen =
  | 'rest'
  | '_hover'
  | '_focusVisible'
  | '_focus'
  | '_active'
  | '_disabled'
  | 'md'

export interface ModelSink {
  prop: string
  css: string
  prefix: string
}

export interface ModelTables {
  canon: ModelSink[]
  color: ModelSink[]
  length: ModelSink[]
  url: ModelSink[]
  auto: ModelSink[]
  none: ModelSink[]
}

export interface ModelResult {
  classes: number
  css: string
  raw: number
  gzip: number
  brotli: number
}

const NAMED_COLORS = [
  'red', 'navy', 'teal', 'olive', 'maroon', 'silver', 'gray', 'aqua',
  'lime', 'fuchsia', 'rebeccapurple', 'cornflowerblue', 'darkslategray',
  'transparent', 'currentColor',
]
const CSS_WIDE = ['inherit', 'initial', 'unset', 'revert', 'revert-layer']
const CLASS_PREFIX = 'reference-ui__'

let cachedTables: ModelTables | null = null

/** Parse the sink tables from the tree: canon triples plus membership lists. */
export function loadModelTables(): ModelTables {
  if (cachedTables) return cachedTables
  const properties = fs.readFileSync(path.join(CANON, 'css', 'properties.rs'), 'utf8')
  const byProp = new Map<string, ModelSink>()
  const canon: ModelSink[] = []
  const triple = /Property::new\(\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/gs
  for (const match of properties.matchAll(triple)) {
    const sink = { prop: match[1]!, css: match[2]!, prefix: match[3]! }
    byProp.set(sink.prop, sink)
    canon.push(sink)
  }
  const member = (source: string, table: string): ModelSink[] =>
    quotedList(source, table).map(prop => {
      const sink = byProp.get(prop)
      if (!sink) throw new Error(`harvest model: ${prop} missing from canon`)
      return sink
    })
  const colorSrc = fs.readFileSync(path.join(CANON, 'css', 'color.rs'), 'utf8')
  const classifySrc = fs.readFileSync(
    path.join(CANON, 'css', 'values', 'classify.rs'),
    'utf8'
  )
  const validitySrc = fs.readFileSync(VALIDITY, 'utf8')
  cachedTables = {
    canon,
    color: member(colorSrc, 'COLOR_PROPERTIES'),
    length: member(classifySrc, 'LENGTH_PROPERTIES'),
    url: member(classifySrc, 'URL_PROPERTIES'),
    auto: member(validitySrc, 'AUTO_PROPS'),
    none: member(validitySrc, 'NONE_PROPS'),
  }
  return cachedTables
}

/** Quoted members of one `const TABLE: &[&str] = &[ ... ];` block. */
function quotedList(source: string, table: string): string[] {
  const block = new RegExp(`${table}[^[]*\\[(.*?)\\];`, 's').exec(source)
  if (!block) throw new Error(`harvest model: ${table} block not found`)
  return [...block[1]!.matchAll(/"([^"]+)"/g)].map(match => match[1]!)
}

/** Length pool of size n: the mission's first-match generator, i = 1..n. */
function lengthPool(n: number): string[] {
  const pool: string[] = []
  for (let i = 1; i <= n; i += 1) {
    if (i % 17 === 0) pool.push(`${(i / 16).toFixed(3)}rem`)
    else if (i % 13 === 0) pool.push(`${i}%`)
    else if (i % 11 === 0) pool.push(`${i}vh`)
    else if (i % 19 === 0) pool.push(`${i}r`)
    else pool.push(`${i}px`)
  }
  return pool
}

/** Color pool of size n: 15 named, then hex, spaceless rgba, oklch. */
function colorPool(n: number): string[] {
  const pool: string[] = []
  for (let i = 0; i < n; i += 1) {
    if (i < 15) pool.push(NAMED_COLORS[i]!)
    else if (i < 15 + Math.floor(0.4 * n)) {
      pool.push(`#${((i * 9973) % 0x1000000).toString(16).padStart(6, '0').slice(-6)}`)
    } else if (i < 15 + Math.floor(0.7 * n)) {
      pool.push(`rgba(${i % 256},${(3 * i) % 256},${(7 * i) % 256},${((i % 10) / 10).toFixed(1)})`)
    } else {
      pool.push(`oklch(${(0.2 + (i % 50) / 100).toFixed(2)} ${(i % 20) / 50} ${i % 360})`)
    }
  }
  return pool
}

function urlPool(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `url(/assets/a${i}.svg)`)
}

function transformPool(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `translateX(${i}px)`)
}

/** Pool mix per total: the mission's 300/500 split. */
function poolsFor(total: 300 | 500): string[][] {
  const n = total === 300 ? [173, 110, 6, 4] : [281, 190, 12, 10]
  return [
    lengthPool(n[0]!),
    colorPool(n[1]!),
    urlPool(n[2]!),
    transformPool(n[3]!),
    [...CSS_WIDE],
    ['auto'],
    ['none'],
  ]
}

/** Class-value sanitize: space, tab, newline map to `_`. */
function sanitize(value: string): string {
  return value.replace(/[ \t\n]/g, '_')
}

/**
 * Selector escape per `stylesheet/name/escape.rs`: allowlist `[A-Za-z0-9_-]`,
 * every other character backslash-escaped, a leading digit or `-` hex-escaped
 * with a trailing space.
 */
function escapeClass(name: string): string {
  let out = ''
  for (let i = 0; i < name.length; i += 1) {
    const ch = name[i]!
    if (i === 0 && (ch === '-' || (ch >= '0' && ch <= '9'))) {
      out += `\\${ch.charCodeAt(0).toString(16)} `
    } else if (/[A-Za-z0-9_-]/.test(ch)) {
      out += ch
    } else {
      out += `\\${ch}`
    }
  }
  return out
}

/**
 * Model `when` spellings: kebab `focus-visible` per the pinned reading.
 * Rest carries no segment.
 */
const WHEN_SEGMENTS: Record<Exclude<ModelWhen, 'rest'>, string> = {
  _hover: 'hover',
  _focusVisible: 'focus-visible',
  _focus: 'focus',
  _active: 'active',
  _disabled: 'disabled',
  md: 'md',
}

function whenSegment(when: ModelWhen): string {
  if (when === 'rest') return ''
  return WHEN_SEGMENTS[when]
}

/**
 * Conditioned selector: short `:is()` wraps per the pinned readings. `md`
 * stays a plain selector; the caller collects those into the container block.
 */
function conditionedSelector(className: string, when: ModelWhen): string {
  const base = `.${escapeClass(className)}`
  switch (when) {
    case '_hover': return `${base}:is(:hover, [data-hover])`
    case '_focusVisible': return `${base}:is(:focus-visible, [data-focus-visible])`
    case '_focus': return `${base}:is(:focus, [data-focus])`
    case '_active': return `${base}:is(:active, [data-active])`
    case '_disabled': return `${base}:is(:disabled, [data-disabled])`
    default: return base
  }
}

/**
 * Build one M-series scenario: pool × sinks crossed per `when`, one rule per
 * line inside `@layer utilities`, `md` rules in a trailing `@container`.
 * Pass `compress: false` for classes+raw only (the counterfactual rows skip
 * the ~50s brotli-11 bill on 8–24 MB sheets they never assert).
 */
export function buildModel(
  total: 300 | 500,
  whens: ModelWhen[],
  compress = true
): ModelResult {
  const tables = loadModelTables()
  const transformSink = tables.canon.find(sink => sink.prop === 'transform')
  if (!transformSink) throw new Error('harvest model: transform missing from canon')
  const sinksByKind: ModelSink[][] = [
    tables.length,
    tables.color,
    tables.url,
    [transformSink],
    tables.canon,
    tables.auto,
    tables.none,
  ]
  const pools = poolsFor(total)
  const emitter: ScenarioEmitter = { sinksByKind, pools, rules: [], mdRules: [] }
  let classes = 0
  for (const when of whens) {
    classes += emitWhen(emitter, when)
  }
  const { rules, mdRules } = emitter
  if (mdRules.length > 0) {
    rules.push('@container (min-width: 768px) {', ...mdRules, '}')
  }
  const css = `@layer utilities {\n${rules.join('\n')}\n}\n`
  const buf = Buffer.from(css, 'utf8')
  if (!compress) return { classes, css, raw: buf.length, gzip: -1, brotli: -1 }
  return compressSheet(classes, css, buf)
}

/** Mutable rule buckets one scenario fills: plain rules plus `md` rules. */
interface ScenarioEmitter {
  sinksByKind: ModelSink[][]
  pools: string[][]
  rules: string[]
  mdRules: string[]
}

/** Cross every kind's sinks with its pool under one `when`; the rule count. */
function emitWhen(emitter: ScenarioEmitter, when: ModelWhen): number {
  let classes = 0
  for (let kind = 0; kind < emitter.sinksByKind.length; kind += 1) {
    for (const sink of emitter.sinksByKind[kind]!) {
      for (const value of emitter.pools[kind]!) {
        emitRule(emitter, sink, value, when)
        classes += 1
      }
    }
  }
  return classes
}

/** One rule into its bucket: `md` rules wait for the container block. */
function emitRule(
  emitter: ScenarioEmitter,
  sink: ModelSink,
  value: string,
  when: ModelWhen
): void {
  const stem = when === 'rest'
    ? `${sink.prefix}_${sanitize(value)}`
    : `${whenSegment(when)}:${sink.prefix}_${sanitize(value)}`
  const className = `${CLASS_PREFIX}${stem}`
  const selector = when === 'rest' || when === 'md'
    ? `.${escapeClass(className)}`
    : conditionedSelector(className, when)
  const rule = `${selector} { ${sink.css}: ${value}; }`
  if (when === 'md') emitter.mdRules.push(rule)
  else emitter.rules.push(rule)
}

/** gzip-6 plus brotli-11 over the finished sheet. */
function compressSheet(classes: number, css: string, buf: Buffer): ModelResult {
  return {
    classes,
    css,
    raw: buf.length,
    gzip: zlib.gzipSync(buf, { level: 6 }).length,
    brotli: zlib.brotliCompressSync(buf, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  }
}
