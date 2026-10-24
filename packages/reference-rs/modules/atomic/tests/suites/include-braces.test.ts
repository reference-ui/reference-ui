/**
 * Include brace limits through the native addon (ATM-E-INCLUDE-BRACE-LIMIT). A caller that skips `ref sync` and
 * hands the addon an include pattern past 1,024 globs or 64 nesting levels gets one error diagnostic naming the
 * pattern, an empty stylesheet and no atoms, instead of an exponential expansion; patterns exactly at the limits and
 * thousands of literal `{x}` pairs still compile. The limits and wording are core's config validation's.
 */
import { describe, expect, it } from 'vitest'
import { compileSync } from '../../js/index.js'
import type { EvaluatedSystemSpec } from '../../js/types.js'
import evaluatedSystemSpecJson from '../../../../contracts/fixtures/evaluated-system-spec.json'
import { LAYER_PREAMBLE } from '../harness/helpers.js'

const baseSystem = evaluatedSystemSpecJson as EvaluatedSystemSpec

const FILES = [
  {
    path: 'src/app.ts',
    content: "import { css } from '@reference-ui/react';\nexport const a = css({ color: 'blue.500' });\n",
  },
]

function compileWith(include: string[]) {
  return compileSync({ baseSystem, files: FILES, include, logs: ['proof'] })
}

describe('include brace limits through the addon', () => {
  it('refuses a pattern that expands past 1,024 globs by name', () => {
    const pattern = `src/${'{a,b}'.repeat(24)}.ts`
    const result = compileWith([pattern])
    expect(result.diagnostics).toHaveLength(1)
    const [refusal] = result.diagnostics
    expect(refusal!.code).toBe('ATM-E-INCLUDE-BRACE-LIMIT')
    expect(refusal!.severity).toBe('error')
    expect(refusal!.message).toBe(`include pattern '${pattern}' expands to more than 1,024 globs`)
    expect(result.stylesheet.startsWith(LAYER_PREAMBLE)).toBe(true)
    expect(result.atomCount).toBe(0)
  })

  it('refuses a pattern that nests past 64 levels, reading a negated pattern by its body', () => {
    const pattern = `!src/${'{a,'.repeat(65)}b${'}'.repeat(65)}.ts`
    const result = compileWith(['src/**', pattern])
    expect(result.diagnostics.map(entry => entry.code)).toEqual(['ATM-E-INCLUDE-BRACE-LIMIT'])
    expect(result.diagnostics[0]!.message).toBe(
      `include pattern '${pattern}' nests braces deeper than 64 levels`
    )
  })

  it('refuses 5,000 sequential pairs without overflowing the stack', () => {
    const result = compileWith([`src/${'{x,y}'.repeat(5000)}.ts`])
    expect(result.diagnostics.map(entry => entry.code)).toEqual(['ATM-E-INCLUDE-BRACE-LIMIT'])
  })

  it('compiles patterns exactly at the limits and 5,000 literal pairs', () => {
    const wide = `src/**/*.ts${'{a,b}'.repeat(10)}`
    const deep = `src/${'{a,'.repeat(64)}b${'}'.repeat(64)}.ts`
    const literal = `src/${'{x}'.repeat(5000)}.ts`
    for (const pattern of [wide, deep, literal]) {
      const result = compileWith([pattern])
      expect(result.diagnostics.map(entry => entry.code)).not.toContain('ATM-E-INCLUDE-BRACE-LIMIT')
    }
    expect(compileWith(['src/**/*.{ts,tsx}']).atomCount).toBeGreaterThan(0)
  })
})
