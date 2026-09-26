/**
 * Coverage tests for the warning fix hints: every minted warning code carries a hint or a named exemption.
 * Reads the five modules' Rust code tables straight from `codes.rs` with a regex, mirroring the registry
 * self-check, so a newly minted warning fails here until it gets a real hint. Test-only negatives and
 * retired-but-wired codes stay out of the hinted set only through the explicit lists below, never silently.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { warningHintFor } from './index'

/** The five modules whose `codes.rs` tables mint the warning codes hints must cover. */
const CODE_TABLES = [
  '../../atomic/src/diagnostics/codes.rs',
  '../../tasty/src/diagnostics/codes.rs',
  '../../atlas/src/diagnostics/codes.rs',
  '../../styletrace/src/diagnostics/codes.rs',
  '../../typegen/src/diagnostics/codes.rs',
] as const

/** Quoted `NS-W-NAME` strings inside a code table, table rows and test fixtures alike. */
const WARNING_PATTERN = /"([A-Z][A-Z0-9]{1,3}-W-[A-Z0-9]+(?:-[A-Z0-9]+)*)"/g

/**
 * Negative-test fixtures (`parse` must refuse these), not minted codes. Each entry must still
 * appear in the raw extraction, so a renamed fixture fails loudly instead of silently dropping.
 */
const TEST_ONLY_CODES: readonly string[] = [
  'ATM-W-NOPE',
  'TST-W-NOPE',
  'ATL-W-NOPE',
  'STT-W-NOPE',
  'TGN-W-NOPE',
]

/**
 * Minted warnings deliberately left hintless, each with its stated reason. Empty today: every
 * minted warning carries a real hint. A retired-but-wired code lands here with its reason, and
 * every entry must still be minted, so stale exemptions fail instead of lingering.
 */
const EXEMPT_CODES: Record<string, string> = {}

function mintedWarningCodes(): string[] {
  const codes = new Set<string>()
  const raw = new Set<string>()
  for (const table of CODE_TABLES) {
    const text = readFileSync(new URL(table, import.meta.url), 'utf-8')
    const found = [...text.matchAll(WARNING_PATTERN)].map(match => match[1] as string)
    expect(found.length, `${table} yields no warning codes`).toBeGreaterThan(0)
    for (const code of found) raw.add(code)
  }
  for (const fixture of TEST_ONLY_CODES) {
    expect(raw.has(fixture), `test-only fixture ${fixture} vanished from the tables`).toBe(true)
  }
  for (const code of raw) {
    if (!TEST_ONLY_CODES.includes(code)) codes.add(code)
  }
  return [...codes].sort()
}

describe('warning hints', () => {
  it('covers every minted warning code with a hint or a named exemption', () => {
    const minted = mintedWarningCodes()
    expect(minted.length).toBeGreaterThan(0)
    const uncovered = minted.filter(
      code => warningHintFor(code) === undefined && EXEMPT_CODES[code] === undefined
    )
    expect(uncovered, `warning codes without a hint or exemption: ${uncovered.join(', ')}`).toEqual(
      []
    )
  })

  it('keeps every exemption live against the minted tables', () => {
    const minted = new Set(mintedWarningCodes())
    for (const code of Object.keys(EXEMPT_CODES)) {
      expect(minted.has(code), `exempt code ${code} is no longer minted`).toBe(true)
      expect(EXEMPT_CODES[code]?.trim().length ?? 0).toBeGreaterThan(0)
    }
  })

  it('returns the pinned fix lines and stays silent off-table', () => {
    expect(warningHintFor('ATM-W-UNKNOWN-PROPERTY')).toBe('remove it or check the property spelling')
    expect(warningHintFor('ATL-W-PACKAGE-SCAN-FAILED')).toBe(
      'fix the package dir so it scans or drop it from include'
    )
    expect(warningHintFor('TGN-W-DUPLICATE-RECIPE-STEM')).toBe(
      'rename one recipe so each stem stays unique'
    )
    expect(warningHintFor('ATM-E-PARSE')).toBeUndefined()
    expect(warningHintFor('ATM-W-NOPE')).toBeUndefined()
    expect(warningHintFor(undefined)).toBeUndefined()
  })
})
