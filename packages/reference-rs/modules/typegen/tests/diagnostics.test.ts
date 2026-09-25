/**
 * TGN diagnostics seam tests for Reference UI type declaration generation.
 * Drives emitDtsDetailed over minimal EvaluatedSystemSpec shapes through the native boundary.
 * Pins one row per TGN-W warning code plus the TGN-E-INVALID-BASE-SYSTEM coded throw.
 * Asserts the detailed dts stays byte-identical to the plain sync emit on every shape.
 */
import { describe, expect, it } from 'vitest'
import { emitDetailed, emitDts, emitDtsDetailed, emitDtsSync } from '../js/index.js'
import type { EvaluatedSystemSpec } from '../js/types.js'
import { compile, expectTscOk } from './tsc'

function spec(overrides: Partial<EvaluatedSystemSpec> = {}): EvaluatedSystemSpec {
  return {
    schemaVersion: 1,
    profile: 'reference-ui',
    name: 'tgn-seam',
    tokens: {},
    fonts: {},
    globalCss: [],
    keyframes: {},
    recipes: {},
    staticCss: {},
    provenance: [],
    ...overrides,
  }
}

function codesOf(baseSystem: EvaluatedSystemSpec, strict?: string[]): string[] {
  return emitDtsDetailed({ baseSystem, strict }).diagnostics.map(entry => entry.code)
}

describe('typegen diagnostics seam', () => {
  it('TGN-SEAM-01 detailed dts matches sync and stays quiet on a clean spec', async () => {
    const baseSystem = spec({
      tokens: { colors: { n100: { value: '#fff' } } },
      breakpoints: { sm: '640px' },
    })
    const detailed = emitDtsDetailed({ baseSystem })
    expect(detailed.dts).toBe(emitDtsSync({ baseSystem }))
    expect(detailed.diagnostics).toEqual([])
    expect(await emitDts({ baseSystem })).toBe(detailed.dts)
    expect(await emitDetailed({ baseSystem })).toEqual(detailed)
  })

  it('TGN-SEAM-02 reports unknown token categories and omits their tokens', () => {
    const baseSystem = spec({
      tokens: {
        colors: { n100: { value: '#fff' } },
        animations: { spin: { value: 'spin 1s' } },
      },
    })
    const detailed = emitDtsDetailed({ baseSystem })
    const found = detailed.diagnostics.filter(
      entry => entry.code === 'TGN-W-UNKNOWN-TOKEN-CATEGORY'
    )
    expect(found.length).toBe(1)
    expect(found[0]?.severity).toBe('warning')
    expect(found[0]?.message).toContain('`animations`')
    expect(detailed.dts).toContain('ColorToken')
    expect(detailed.dts).not.toContain('spin')
  })

  it('TGN-SEAM-03 reports invalid recipe names and keeps siblings', () => {
    const baseSystem = spec({
      recipes: {
        '123': { variants: { size: { sm: { p: '1r' } } } },
        button: { variants: { size: { sm: { p: '1r' } } } },
      },
    })
    const detailed = emitDtsDetailed({ baseSystem })
    expect(codesOf(baseSystem)).toEqual(['TGN-W-INVALID-RECIPE-NAME'])
    expect(detailed.dts).toContain('ButtonVariantProps')
  })

  it('TGN-SEAM-04 reports empty recipes and empty axes at their scope', () => {
    const whole = spec({ recipes: { card: { variants: {} } } })
    expect(codesOf(whole)).toEqual(['TGN-W-EMPTY-RECIPE'])
    expect(emitDtsDetailed({ baseSystem: whole }).dts).not.toContain('CardVariantProps')

    const axis = spec({
      recipes: {
        button: { variants: { size: {}, tone: { quiet: { bg: 'n100' } } } },
      },
    })
    const detailed = emitDtsDetailed({ baseSystem: axis })
    expect(detailed.diagnostics.map(entry => entry.code)).toEqual(['TGN-W-EMPTY-RECIPE'])
    expect(detailed.diagnostics[0]?.message).toContain('`size`')
    expect(detailed.dts).toContain('ButtonVariantProps')
  })

  it('TGN-SEAM-05 reports invalid compound rows without leaking literals', () => {
    const baseSystem = spec({
      recipes: {
        button: {
          variants: { tone: { quiet: { bg: 'n100' }, loud: { bg: 'n300' } } },
          compoundVariants: [
            { tone: 'loud', css: { border: '1px' } },
            { tone: 'nope', css: {} },
          ],
        },
      },
    })
    const detailed = emitDtsDetailed({ baseSystem })
    expect(codesOf(baseSystem)).toEqual(['TGN-W-INVALID-COMPOUND-VARIANT'])
    expect(detailed.dts).toContain('ButtonCompoundVariant')
    expect(detailed.dts).not.toContain("'nope'")
  })

  it('TGN-SEAM-06 reports unknown strict names and dedupes repeats', () => {
    const baseSystem = spec({
      tokens: { colors: { n100: { value: '#fff' } } },
      breakpoints: { sm: '640px' },
    })
    const detailed = emitDtsDetailed({ baseSystem, strict: ['colors', 'nope', 'nope'] })
    expect(detailed.diagnostics.map(entry => entry.code)).toEqual([
      'TGN-W-UNKNOWN-STRICT-CATEGORY',
    ])
    expect(detailed.dts).toContain('StrictColorProps')
  })

  it('TGN-SEAM-07 reports absent strict categories without wrapping', () => {
    const baseSystem = spec({
      tokens: { colors: { n100: { value: '#fff' } } },
      breakpoints: { sm: '640px' },
    })
    const detailed = emitDtsDetailed({ baseSystem, strict: ['spacing'] })
    expect(codesOf(baseSystem, ['spacing'])).toEqual(['TGN-W-ABSENT-STRICT-CATEGORY'])
    expect(detailed.dts).not.toContain('StrictSpacingProps')
  })

  it('TGN-SEAM-08 reports empty font families and keeps siblings', () => {
    const baseSystem = spec({
      fonts: {
        sans: { value: 'Inter', weights: { normal: '400' } },
        display: { value: 'Fancy', weights: {} },
      },
    })
    const detailed = emitDtsDetailed({ baseSystem })
    expect(codesOf(baseSystem)).toEqual(['TGN-W-EMPTY-FONT-FAMILY'])
    expect(detailed.dts).toContain("'sans'")
    expect(detailed.dts).not.toContain("'display'")
  })

  it('TGN-SEAM-09 refuses invalid specs as a coded throw on both entrypoints', () => {
    const invalidVersion = spec({ schemaVersion: 999 as unknown as 1 })
    for (const run of [
      () => emitDtsSync({ baseSystem: invalidVersion }),
      () => emitDtsDetailed({ baseSystem: invalidVersion }),
    ]) {
      expect(run).toThrow('TGN-E-INVALID-BASE-SYSTEM')
      expect(run).toThrow(/schema\s*version/i)
    }

    const unknownField = { ...spec(), rogueProperty: 'illegal' } as EvaluatedSystemSpec
    expect(() => emitDtsDetailed({ baseSystem: unknownField })).toThrow(
      'TGN-E-INVALID-BASE-SYSTEM'
    )
    expect(() => emitDtsDetailed({ baseSystem: unknownField })).toThrow(/unknown field/i)
  })

  it('TGN-SEAM-10 reports colliding recipe stems once and tsc accepts the emit', () => {
    const baseSystem = spec({
      recipes: {
        button: { variants: { size: { sm: { p: '1r' }, lg: { p: '3r' } } } },
        Button: { variants: { flavor: { sweet: { bg: 'n100' } } } },
      },
    })
    const detailed = emitDtsDetailed({ baseSystem })
    expect(detailed.diagnostics.map(entry => entry.code)).toEqual([
      'TGN-W-DUPLICATE-RECIPE-STEM',
    ])
    expect(detailed.diagnostics[0]?.message).toContain('`Button`')
    expect(detailed.dts).toBe(emitDtsSync({ baseSystem }))
    expect(detailed.dts.match(/export type ButtonVariantProps/g) ?? []).toHaveLength(1)
    expect(detailed.dts).not.toContain('flavor')
    expectTscOk(
      compile({
        dts: detailed.dts,
        source: `import type { ButtonVariantProps } from './styles'\n\nexport const props: ButtonVariantProps = { size: 'sm' }\n`,
      })
    )
  })
})
