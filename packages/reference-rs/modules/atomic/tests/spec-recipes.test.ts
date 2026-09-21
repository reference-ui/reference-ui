/**
 * Seam proof that evaluated-spec theme recipes lower into runtime recipe tables.
 * A populated spec.recipes (button with variant/disabled axes, defaults, and one
 * compound) must emit a qualified `${system}__button` table with derivation
 * inputs (value-name lists, index defaults, unexpanded predicates,
 * breakpoint list), and `@layer recipes` rules. An empty spec.recipes emits
 * nothing. This is the M0-fix14-A probe: populated spec in, non-empty
 * tables out.
 */
import { describe, expect, it } from 'vitest'
import { compileSync } from '../js/index.js'
import type { EvaluatedSystemSpec } from '../js/types.js'
import evaluatedSystemSpecJson from '../../../contracts/fixtures/evaluated-system-spec.json'

const specSystem = evaluatedSystemSpecJson as EvaluatedSystemSpec
const STEM = 'lib-test-system__button'

describe('spec recipe lowering', () => {
  it('lowers populated spec.recipes into qualified runtime recipe tables', () => {
    const result = compileSync({ baseSystem: specSystem, files: [], logs: ['proof'] })

    expect(Object.keys(result.runtime.recipes)).toContain(STEM)
    const table = result.runtime.recipes[STEM]!
    expect(table.qualifiedName).toBeUndefined()
    expect(table.variantKeys).toBeUndefined()
    expect(table.variantMap['variant']).toEqual(['solid', 'outline'])
    expect(table.variantMap['disabled']).toEqual(['true', 'false'])
    expect(table.defaultVariants).toEqual({ variant: 0, disabled: 1 })
    expect(table.responsiveBreakpoints).toBeUndefined()
    expect(result.runtime.responsiveBreakpoints).toEqual(['sm', 'md', 'lg', 'xl', '2xl'])
    expect(table.combinations).toBeUndefined()
    expect(table.responsiveVariantMap).toBeUndefined()
    expect(table.compoundVariants).toHaveLength(1)
    expect(table.compoundVariants[0]?.predicates).toEqual({
      variant: ['solid'],
      disabled: ['true'],
    })
    expect(Object.keys(table.compoundVariants[0]?.predicates ?? {})).toEqual([
      'variant',
      'disabled',
    ])
    expect(table.compoundVariants[0]?.className).toBeUndefined()
    expect(result.recipes).toHaveLength(1)
    expect(result.stylesheet).toContain('@layer recipes')
    expect(result.stylesheet).toContain(`${STEM}__base`)
    expect(result.portableStylesheet).toContain(`${STEM}__base`)
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
  })

  it('emits no runtime recipes when spec.recipes is empty', () => {
    const result = compileSync({
      baseSystem: { ...specSystem, recipes: {} },
      files: [],
      logs: ['proof'],
    })

    expect(result.runtime.recipes).toEqual({})
    expect(result.recipes ?? []).toEqual([])
    expect(result.stylesheet).not.toContain('@layer recipes {')
  })
})
