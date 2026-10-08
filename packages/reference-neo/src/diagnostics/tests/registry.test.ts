// Registry self-check: every diagnostic code cited in REGISTRY.md resolves.
// It takes the registry markdown plus the five module CODE_TABLEs and the
// diagnostics crate's own golden pins, and asserts the cited-minus-defined
// set is empty with a defined-size floor so it cannot pass vacuously.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..', '..', '..')
const RS = join(ROOT, 'packages', 'reference-rs')

const CODE_TABLES = [
  'modules/atomic/src/diagnostics/codes.rs',
  'modules/atlas/src/diagnostics/codes.rs',
  'modules/tasty/src/diagnostics/codes.rs',
  'modules/styletrace/src/diagnostics/codes.rs',
  'modules/typegen/src/diagnostics/codes.rs',
] as const

// Template placeholder attestations: the diagnostics crate's own goldens.
const PLACEHOLDER_SOURCES = [
  'modules/diagnostics/src/transport.rs',
  'modules/diagnostics/src/code.rs',
] as const

function citedCodes(text: string): string[] {
  // Strict W/E shape only; skip glob prefixes (RS-W-EXAMPLE-*, RS-E-EXAMPLE-*,
  // and any other *- glob) by dropping matches continued with -*.
  const pattern = /([A-Z]{2,4})-([WE])-([A-Z0-9]+(?:-[A-Z0-9]+)*)/g
  const out = new Set<string>()
  for (const m of text.matchAll(pattern)) {
    if (text.startsWith('-*', (m.index ?? 0) + m[0].length)) continue
    out.add(m[0])
  }
  return [...out]
}

function definedCodes(): Set<string> {
  const defined = new Set<string>()
  const literal = /"([A-Z]{2,4}-[WEI]-[A-Z0-9]+(?:-[A-Z0-9]+)*)"/g
  for (const table of CODE_TABLES) {
    const text = readFileSync(join(RS, table), 'utf8')
    for (const m of text.matchAll(literal)) defined.add(m[1]!)
  }
  const keeping = /RS-[WE]-EXAMPLE-[A-Z0-9]+(?:-[A-Z0-9]+)*/g
  for (const file of PLACEHOLDER_SOURCES) {
    const text = readFileSync(join(RS, file), 'utf8')
    for (const m of text.matchAll(keeping)) defined.add(m[0])
  }
  return defined
}

describe('diagnostics registry self-check', () => {
  it('every code cited in REGISTRY.md is defined', () => {
    const registry = readFileSync(join(RS, 'modules/diagnostics/REGISTRY.md'), 'utf8')
    const cited = citedCodes(registry)
    expect(cited.length).toBeGreaterThan(60) // guard against a vacuous extractor
    const defined = definedCodes()
    expect(defined.size).toBeGreaterThan(70) // table codes plus RS placeholders
    const unresolved = cited.filter(code => !defined.has(code))
    expect(unresolved).toEqual([])
  })
})
