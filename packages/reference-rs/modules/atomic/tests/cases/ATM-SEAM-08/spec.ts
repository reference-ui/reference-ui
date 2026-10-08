/**
 * Namer-golden station (ATM-SEAM-08). The compiler generates one namer golden
 * per lexical function and per procedure — an input to output file the runtime
 * namer must reproduce exactly. This station runs one block per committed
 * file in tests/namer-goldens, lexical functions first, then each procedure,
 * then the composed name() cases, so a drift names the exact function that
 * moved. The compiler namer stays the oracle: this compile's plans anchor it.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../helpers.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const GOLDEN_DIR = path.resolve(HERE, '..', '..', 'namer-goldens')

interface NamerGolden {
  /** Runtime namer export under test, e.g. collapseWhitespace or name. */
  function: string
  cases: Array<{ input: unknown; output: unknown }>
}

type NamerFn = (input: unknown, tables: unknown, system?: string) => unknown

/**
 * `$pairs` decode: integer-keyed per-prop golden inputs travel as
 * `{ $pairs: [[key, value], ...] }` in authored order, because JSON.parse
 * would destroy non-V8 order the same way the substrate does (doom-5).
 * Rebuilt here into the V8-ordered object the substrate delivers, so the
 * golden pins the algorithm with order given. Sole-key plus pair-array
 * shape required: anything else passes through untouched.
 */
function decodeValue(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
  if (keys.length !== 1 || keys[0] !== '$pairs' || !Array.isArray(obj['$pairs'])) return value
  return Object.fromEntries(obj['$pairs'] as Array<[string, unknown]>)
}

/** Decode a golden probe input's per-prop value before the mirror runs. */
function decodeInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return input
  const rec = input as Record<string, unknown>
  if (!('value' in rec)) return input
  return { ...rec, value: decodeValue(rec['value']) }
}

function readGoldens(): NamerGolden[] {
  expect(
    fs.existsSync(GOLDEN_DIR),
    `namer goldens live in ${GOLDEN_DIR}: the compiler generates one input to output file per lexical function and procedure`
  ).toBe(true)
  const files = fs.readdirSync(GOLDEN_DIR).filter(name => name.endsWith('.json')).sort()
  expect(files.length, `committed namer golden files in ${GOLDEN_DIR}`).toBeGreaterThan(0)
  return files.map(name => {
    const parsed = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, name), 'utf8')) as NamerGolden
    expect(typeof parsed.function, `${name} names its runtime namer function`).toBe('string')
    expect(Array.isArray(parsed.cases), `${name} carries input to output cases`).toBe(true)
    return parsed
  })
}

const spec: AtomicCaseSpec = {
  id: 'ATM-SEAM-08',
  async verify(result) {
    // Oracle half (green): this compile's plans anchor the compiler namer.
    expect(result.stylePlans.length).toBeGreaterThan(0)

    // Golden half (red until the runtime namer lands beside the compiler):
    // every file reproduces exactly as fn(input, tables, system).
    const goldens = readGoldens()
    const entry = pathToFileURL(path.resolve(HERE, '..', '..', '..', 'js', 'namer', 'index.js')).href
    const namer = (await import(entry)) as unknown as Record<string, NamerFn>
    const tables = result.runtime.namer
    const system = result.stylePlans[0]?.system ?? ''
    for (const golden of goldens) {
      const fn = namer[golden.function]
      expect(typeof fn, `runtime namer exports ${golden.function}`).toBe('function')
      for (const [index, probe] of golden.cases.entries()) {
        expect(fn(decodeInput(probe.input), tables, system), `${golden.function} case ${index}`).toEqual(probe.output)
      }
    }
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
