/**
 * Enterprise harvest census: the committed reader over the enterprise
 * fixture compile. Takes the fixture dir plus `pool-census.json` (written by
 * the Rust reader under `pnpm agentrs c atomic -t harvest`) and emits every
 * R1 number:
 * sink census, pool triple, net-new vs gross, byte cells, and Node parse
 * times. Preconditions: the census JSON is fresh, and `dist/namer.mjs` is
 * built for the react bundle. The `react.mjs` cell carries the mission's
 * re-verify-after-Jettison-acceptance caveat.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import { beforeAll, describe, expect, it } from 'vitest'
import * as csstree from 'css-tree'
import { compile } from '../js/index.js'
import type { CompileResult, Want } from '../js/types.js'
import { LIB_SYSTEM_SPEC } from './helpers.js'
import { buildModel, type ModelWhen } from './harvest-model.js'
import { publishRuntimeBundle } from '../../../../reference-neo/src/sync/publish/styled.ts'
import { publishReactBundle } from '../../../../reference-neo/src/sync/react.ts'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_SRC = path.join(HERE, 'fixtures', 'harvest-enterprise', 'src')
const CENSUS_JSON = path.join(HERE, 'fixtures', 'harvest-enterprise', 'pool-census.json')

/** Mission M-cells: classes / raw / gzip-6 / brotli-11. Variants pin classes + raw only. */
const M_CELLS: { total: 300 | 500; whens: ModelWhen[]; cells: number[] }[] = [
  { total: 300, whens: ['rest'], cells: [22468, 1561214, 165455, 89987] },
  { total: 500, whens: ['rest'], cells: [33806, 2395791, 249341, 130121] },
  { total: 500, whens: ['rest', '_hover', 'md'], cells: [101418, 8404381] },
  { total: 500, whens: ['rest', '_hover', '_focusVisible', 'md'], cells: [135224, 12693287] },
  {
    total: 500,
    whens: ['rest', '_hover', '_focusVisible', '_focus', '_active', '_disabled', 'md'],
    cells: [236642, 23531645],
  },
]

type SinkRow = [prop: string, when: string[], kind: string, minted: number]

/** Expected sink census, `(prop, when)` sorted: the evidence numbers, pinned. */
const EXPECTED_SINKS: SinkRow[] = [
  ['backgroundColor', [], 'color', 137],
  ['backgroundImage', [], 'url', 11],
  ['bg', [], 'color', 160],
  ['borderBottomColor', [], 'color', 147],
  ['borderColor', [], 'color', 141],
  ['color', [], 'color', 128],
  ['color', ['_hover'], 'color', 154],
  ['display', [], 'keyword', 5],
  ['fill', [], 'color', 151],
  ['fontSize', [], 'length', 171],
  ['height', [], 'length', 172],
  ['margin', [], 'length', 173],
  ['marginBlock', [], 'length', 172],
  ['marginBottom', [], 'length', 175],
  ['marginInline', [], 'length', 174],
  ['marginLeft', [], 'length', 174],
  ['marginRight', [], 'length', 175],
  ['marginTop', [], 'length', 175],
  ['maxWidth', [], 'length', 172],
  ['minWidth', [], 'length', 172],
  ['outlineColor', [], 'color', 150],
  ['padding', [], 'length', 168],
  ['paddingBlock', [], 'length', 173],
  ['paddingBottom', [], 'length', 173],
  ['paddingInline', [], 'length', 173],
  ['paddingLeft', [], 'length', 173],
  ['paddingRight', [], 'length', 173],
  ['paddingTop', [], 'length', 173],
  ['stroke', [], 'color', 151],
  ['transform', [], 'transform', 10],
  ['width', [], 'length', 171],
  ['width', ['md'], 'length', 176],
]

const EXPECTED_NET_NEW = 4803
const EXPECTED_POOL = { color: 149, keyword: 7, length: 170, math: 0, transform: 6, url: 8 }
const EXPECTED_GROSS = 4938

/** Expected `(|P-L|, |P∩L|, |P|)` by kind: the D1 bound, pinned. */
const EXPECTED_TRIPLE: Record<string, [number, number, number]> = {
  color: [75, 74, 149],
  keyword: [3, 4, 7],
  length: [119, 51, 170],
  math: [0, 0, 0],
  transform: [4, 2, 6],
  url: [6, 2, 8],
}

/** Expected byte cells: filled from the first measured run, then pinned. */
const EXPECTED_BYTES = {
  cssRaw: 341037,
  cssGzip: 41496,
  cssBrotli: 21057,
  stylePlans: 4938,
  harvestWants: EXPECTED_NET_NEW,
  reactRaw: 148379,
  reactGzip: 32543,
  fixtureRules: 4941,
  m500Rules: 33806,
}

/**
 * Expected backchannel histogram: 135 static-leaf lookups, 33 dynamic sites
 * (32 holes + the gap control), 33 dynamic warnings, but only 32 sink infos
 * — the gap site warns yet never sinks (record-time filter).
 */
const EXPECTED_COMPILER_CODES: [string, number][] = [
  ['ATM-I-EXPECTED-LOOKUP', 135],
  ['ATM-I-DYNAMIC-SLOT', 33],
  ['ATM-W-DYNAMIC-IDENTIFIER', 33],
  ['ATM-I-HARVEST-SINK', 32],
]

interface PoolCensus {
  pool: Record<string, string[]>
  sinks: { prop: string; when: string[]; kind: string; offered: number }[]
  gross: number
}

const INFO_PATTERN = /^(\S+) under \[(.*)\]: (\d+) harvested values? minted$/

let result: CompileResult
let census: PoolCensus
let siteValues: Set<string>
let m500css = ''

function collectFixture(dir: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = []
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1
    )) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push({ path: path.relative(FIXTURE_SRC, full), content: fs.readFileSync(full, 'utf8') })
      }
    }
  }
  walk(dir)
  return files.sort((a, b) => (a.path < b.path ? -1 : 1))
}

function stringValue(want: Want): string | null {
  const value = want.value as unknown
  if (typeof value === 'object' && value !== null && 'String' in value) {
    return (value as { String: string }).String
  }
  return null
}

function parseInfo(message: string): { prop: string; when: string[]; minted: number } {
  const match = INFO_PATTERN.exec(message)
  if (!match) throw new Error(`harvest census: unparseable sink info: ${message}`)
  return {
    prop: match[1]!,
    when: match[2] === '' ? [] : match[2]!.split(', '),
    minted: Number(match[3]),
  }
}

/**
 * CSS style rules: `Rule` nodes outside `@keyframes` (keyframe selectors are
 * `Rule` nodes to css-tree but keyframe rules, not style rules, to CSSOM —
 * counting them would split this number from the Chromium side by 70).
 */
function styleRuleCount(sheet: string): number {
  const ast = csstree.parse(sheet, { onParseError() {} })
  const keyframed = new Set<csstree.CssNode>()
  csstree.walk(ast, {
    visit: 'Atrule',
    enter(node) {
      if (node.type !== 'Atrule' || node.name?.toLowerCase() !== 'keyframes') return
      if (!node.block) return
      csstree.walk(node.block, {
        visit: 'Rule',
        enter(rule) {
          keyframed.add(rule)
        },
      })
    },
  })
  let rules = 0
  csstree.walk(ast, {
    visit: 'Rule',
    enter(node) {
      if (!keyframed.has(node)) rules += 1
    },
  })
  return rules
}

function median(values: number[]): number {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!
}

function timeParse(sheet: string, rounds = 7): { medianMs: number; firstMs: number } {
  const samples: number[] = []
  for (let i = 0; i < rounds; i += 1) {
    const start = performance.now()
    csstree.parse(sheet, { onParseError() {} })
    samples.push(performance.now() - start)
  }
  return { medianMs: median(samples), firstMs: samples[0]! }
}

describe('enterprise harvest census', () => {
  beforeAll(async () => {
    census = JSON.parse(fs.readFileSync(CENSUS_JSON, 'utf8')) as PoolCensus
    result = await compile({
      files: collectFixture(FIXTURE_SRC),
      baseSystem: LIB_SYSTEM_SPEC,
      logs: ['compiler'],
    })
    siteValues = new Set(
      (result.wants ?? [])
        .filter(want => want.origin !== 'harvest')
        .map(stringValue)
        .filter((value): value is string => value !== null)
    )
  }, 120_000)

  it('pins the M-series bounds beside the fixture', () => {
    let m300raw = 0
    for (const scenario of M_CELLS) {
      const wantBytes = scenario.cells.length === 4
      const built = buildModel(scenario.total, scenario.whens, wantBytes)
      const [classes, raw, gzip, brotli] = scenario.cells
      expect(built.classes, `M${scenario.total}×${scenario.whens.length} classes`).toBe(classes)
      expect(built.raw, `M${scenario.total}×${scenario.whens.length} raw`).toBe(raw)
      if (wantBytes) {
        expect(built.gzip, `M${scenario.total} gzip`).toBe(gzip)
        expect(built.brotli, `M${scenario.total} brotli`).toBe(brotli)
        if (scenario.total === 300) m300raw = built.raw
        else m500css = built.css
      }
    }
    console.log(`harvest model: M300=${m300raw}B M500=${Buffer.byteLength(m500css, 'utf8')}B`)
  }, 120_000)

  it('censuses sinks, pool join, and byte cells', () => {
    expect(result.diagnostics ?? [], 'default channel stays silent').toEqual([])
    const compiler = result.compilerDiagnostics ?? []
    expect(compiler.length > 0, 'backchannel populates').toBe(true)
    expect(
      compiler.filter(entry => entry.severity === 'error'),
      'no compiler errors'
    ).toEqual([])
    const codes = new Map<string, number>()
    for (const entry of compiler) codes.set(entry.code, (codes.get(entry.code) ?? 0) + 1)
    console.log(`harvest compiler codes: ${JSON.stringify([...codes])}`)
    expect([...codes], 'backchannel histogram (gap warns, never sinks)').toEqual(
      EXPECTED_COMPILER_CODES
    )

    const infos = compiler
      .filter(entry => entry.code === 'ATM-I-HARVEST-SINK')
      .map(entry => parseInfo(entry.message))
      .sort((a, b) =>
        a.prop < b.prop ? -1 : a.prop > b.prop ? 1 : a.when.join().localeCompare(b.when.join())
      )
    const kinds = new Map(census.sinks.map(sink => [`${sink.prop} [${sink.when.join(',')}]`, sink.kind]))
    const rows: SinkRow[] = infos.map(info => [
      info.prop,
      info.when,
      kinds.get(`${info.prop} [${info.when.join(',')}]`) ?? 'MISSING',
      info.minted,
    ])
    console.log(`harvest sinks: ${JSON.stringify(rows)}`)
    expect(rows, 'sink census (prop, when, kind, minted)').toEqual(EXPECTED_SINKS)

    const netNew = infos.reduce((sum, info) => sum + info.minted, 0)
    expect(netNew, 'net-new Σ minted').toBe(EXPECTED_NET_NEW)
    const harvestCount = (result.wants ?? []).filter(w => w.origin === 'harvest').length
    expect(harvestCount, 'harvest wants equal net-new').toBe(EXPECTED_NET_NEW)

    expect(census.gross, 'gross offered').toBe(EXPECTED_GROSS)
    for (const [kind, expected] of Object.entries(EXPECTED_POOL)) {
      expect(census.pool[kind]?.length ?? 0, `pool ${kind}`).toBe(expected)
    }
    const triple: Record<string, [number, number, number]> = {}
    for (const [kind, values] of Object.entries(census.pool)) {
      const set = new Set(values)
      const shared = [...set].filter(value => siteValues.has(value)).length
      triple[kind] = [set.size - shared, shared, set.size]
    }
    console.log(`harvest triple: ${JSON.stringify(triple)}`)
    expect(triple, '(|P-L|, |P∩L|, |P|) by kind').toEqual(EXPECTED_TRIPLE)
    expect(siteValues.has('#0026f5'), 'unread hex stays unbound').toBe(false)
    expect(siteValues.has('#04b7ab'), 'shared hex binds a leaf').toBe(true)
    expect(siteValues.has('unset'), 'unset stays unbound').toBe(false)
    expect(siteValues.has('none'), 'none binds a leaf').toBe(true)

    const sheet = result.stylesheet
    const sheetBuf = Buffer.from(sheet, 'utf8')
    const measured = {
      cssRaw: sheetBuf.length,
      cssGzip: zlib.gzipSync(sheetBuf, { level: 6 }).length,
      cssBrotli: zlib.brotliCompressSync(sheetBuf, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
      }).length,
      stylePlans: result.stylePlans.length,
      fixtureRules: styleRuleCount(sheet),
    }
    console.log(`harvest bytes: ${JSON.stringify(measured)}`)
    expect(measured.cssRaw, 'styles.css raw').toBe(EXPECTED_BYTES.cssRaw)
    expect(measured.cssGzip, 'styles.css gzip').toBe(EXPECTED_BYTES.cssGzip)
    expect(measured.cssBrotli, 'styles.css brotli').toBe(EXPECTED_BYTES.cssBrotli)
    expect(measured.stylePlans, 'stylePlans').toBe(EXPECTED_BYTES.stylePlans)
    expect(measured.fixtureRules, 'fixture rule count').toBe(EXPECTED_BYTES.fixtureRules)
  }, 120_000)

  it('publishes react.mjs bytes (re-verify after Jettison acceptance)', async () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harvest-'))
    try {
      const systemName = (LIB_SYSTEM_SPEC as { name: string }).name
      publishRuntimeBundle(outDir, systemName, result.runtime)
      await publishReactBundle({
        outDir,
        systemName,
        stylePropNames: result.runtime.stylePropNames,
      })
      const bundle = fs.readFileSync(path.join(outDir, 'react', 'react.mjs'))
      const measured = {
        reactRaw: bundle.length,
        reactGzip: zlib.gzipSync(bundle, { level: 6 }).length,
      }
      console.log(`harvest react: ${JSON.stringify(measured)}`)
      expect(measured.reactRaw, 'react.mjs raw').toBe(EXPECTED_BYTES.reactRaw)
      expect(measured.reactGzip, 'react.mjs gzip').toBe(EXPECTED_BYTES.reactGzip)
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true })
    }
  }, 180_000)

  it('times css-tree parse of the fixture sheet and M500', () => {
    expect(styleRuleCount(m500css), 'M500 rule count').toBe(EXPECTED_BYTES.m500Rules)
    const fixture = timeParse(result.stylesheet)
    const model = timeParse(m500css)
    console.log(
      `harvest css-tree: fixture ${styleRuleCount(result.stylesheet)} rules ` +
        `median ${fixture.medianMs.toFixed(1)}ms cold ${fixture.firstMs.toFixed(1)}ms; ` +
        `M500 33806 rules median ${model.medianMs.toFixed(1)}ms cold ${model.firstMs.toFixed(1)}ms`
    )
  }, 120_000)
})
