/**
 * `token()` / `token.var()` call surface (ATM-SITE-45, SPEC-V2-61). Paths fold
 * to `{path}` references that print theme-live `var()` aliases — never
 * parse-time hex; unknown paths with a fallback carry it, without one they
 * error with no ghost. Aliases, const paths, const fallbacks, static
 * templates, `token()` consts, and JSX attrs fold; every other shape warns
 * against the surface with siblings kept.
 */
import { expect } from 'vitest'
import {
  compileCase,
  getWantsForProp,
  harvestWants,
  hasWant,
  siteWants,
  type AtomicCaseSpec,
} from '../../helpers.js'

function tokenWant(result: unknown, prop: string, path: string): boolean {
  const wants = (result as { wants?: unknown[] }).wants ?? []
  return wants.some(w => {
    const v = w as { prop?: string; value?: { Token?: { path?: string } } }
    return v.prop === prop && v.value?.Token?.path === path
  })
}

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-45',
  async verify(result) {
    expect(hasWant(result, 'color', '{colors.red.500}')).toBe(true)
    expect(hasWant(result, 'color', '{colors.gray.800}')).toBe(true)
    expect(hasWant(result, 'color', '{colors.nope.996}')).toBe(true)
    expect(hasWant(result, 'backgroundColor', '{colors.red.500}')).toBe(true)
    expect(tokenWant(result, 'color', 'colors.nope.999')).toBe(true)
    expect(tokenWant(result, 'color', 'colors.red.500')).toBe(true)
    expect(tokenWant(result, 'color', 'colors.nope.998')).toBe(true)
    expect(tokenWant(result, 'color', 'colors.nope.997')).toBe(true)
    // The refused color position harvests the three fallback hexes.
    expect(siteWants(result).filter(w => w.prop === 'color')).toHaveLength(13)
    expect(getWantsForProp(result, 'color')).toHaveLength(16)
    expect(harvestWants(result)).toHaveLength(3)
    expect(result.wants ?? []).toHaveLength(32)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(22)

    const sheet = result.stylesheet
    expect(sheet).toContain('color: var(--colors-red-500);')
    expect(sheet).toContain('color: var(--colors-gray-800);')
    expect(sheet).toContain('background-color: var(--colors-red-500);')
    expect(sheet).toContain('color: #000;')
    expect(sheet).toContain('color: #fff;')
    expect(sheet).toContain('color: #111;')
    expect(sheet).not.toContain('nope.996')

    // Call refusals + sink info ride the opt-in channel now (S6 E8-class
    // re-point); the fatal token error + three warn-and-paint passthroughs
    // stay default (fatals never move; R9 per O8 R3).
    const defaults = result.diagnostics ?? []
    const defaultWarnsAndErrors = defaults.filter(d => d.severity !== 'info')
    expect(defaultWarnsAndErrors).toHaveLength(4)
    expect(defaultWarnsAndErrors.map(d => d.code).sort()).toEqual([
      'ATM-E-UNKNOWN-TOKEN',
      'ATM-W-UNKNOWN-TOKEN-PATH',
      'ATM-W-UNKNOWN-TOKEN-PATH',
      'ATM-W-UNKNOWN-TOKEN-PATH',
    ])
    const errors = defaults.filter(d => d.severity === 'error')
    expect(errors).toHaveLength(1)
    expect(errors[0]?.message ?? '').toMatch(/colors\.nope\.996/)

    const opted = await compileCase('ATM-SITE-45', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(12)
    expect(infos).toHaveLength(1)
    expect(infos[0]!.code).toBe('ATM-I-HARVEST-SINK')
    const codes = warnings.map(d => d.code).sort()
    expect(codes).toEqual([
      'ATM-W-DYNAMIC-EXPRESSION',
      'ATM-W-DYNAMIC-EXPRESSION',
      'ATM-W-DYNAMIC-EXPRESSION',
      'ATM-W-TOKEN-CALL-REFUSED',
      'ATM-W-TOKEN-CALL-REFUSED',
      'ATM-W-TOKEN-CALL-REFUSED',
      'ATM-W-TOKEN-CALL-REFUSED',
      'ATM-W-TOKEN-CALL-REFUSED',
      'ATM-W-TOKEN-CALL-REFUSED',
      'ATM-W-TOKEN-CALL-REFUSED',
      'ATM-W-TOKEN-CALL-REFUSED',
      'ATM-W-TOKEN-CALL-REFUSED',
    ])
    const refused = warnings
      .filter(d => d.code === 'ATM-W-TOKEN-CALL-REFUSED')
      .map(d => d.message)
      .join('\n')
    expect(refused).toMatch(/takes a path/)
    expect(refused).toMatch(/must not be empty/)
    expect(refused).toMatch(/surface is token/)
    expect(refused).toMatch(/fallback must be/)
  },
}

export default spec
