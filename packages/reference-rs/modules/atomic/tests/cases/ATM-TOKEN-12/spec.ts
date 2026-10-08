/**
 * Missing-reference station. A whole-value `{colors.nope}` and an embedded
 * `{colors.nope}` segment each error naming the ref with file:line, and both
 * declarations are dropped so the sheet stays valid CSS. Valid siblings
 * (`border-width`, `border-style`, the `{colors.gray.800}` control) still
 * emit. Panda's serialize path escapes the literal (`colors\.nope`); this
 * engine fails closed instead. Braceless brace shape (doom-4 T1): `{}}`
 * refuses like a braced ref (starts-with-`{` AND ends-with-`}`) while the
 * runtime namer keeps the stem, so the differential carves the extra.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-12',
  verify(result) {
    expect(result.diagnostics).toHaveLength(4)
    const missingLines: number[] = []
    const bracelessLines: number[] = []
    for (const diagnostic of result.diagnostics) {
      if (diagnostic.severity === 'error') {
        expect(diagnostic.message).toContain('unknown token reference')
        expect(diagnostic.line).toBeGreaterThan(0)
        expect(diagnostic.column).toBeGreaterThan(0)
        if (diagnostic.file?.match(/missing-ref\.tsx$/)) {
          expect(diagnostic.message).toContain('{colors.nope}')
          missingLines.push(diagnostic.line!)
        } else {
          expect(diagnostic.file).toMatch(/braceless\.tsx$/)
          expect(diagnostic.message).toContain('{}}')
          bracelessLines.push(diagnostic.line!)
        }
      }
    }
    expect(missingLines.sort()).toEqual([4, 5])
    expect(bracelessLines).toEqual([9])
    // The fatal drops the declaration, and proof names the proven miss
    // beside it: the exact runtime lookup has no compiled style plan.
    const miss = result.diagnostics.find(
      d => d.code === 'ATM-W-MISSING-STYLE-PLAN'
    )
    expect(miss, 'proven-miss warning beside the fatal').toBeDefined()
    expect(miss!.severity).toBe('warning')
    expect(miss!.message).toContain('color')
    expect(miss!.message).toContain('{colors.nope}')
    expect(miss!.message).toContain('has no compiled style plan')
    expect(result.stylesheet).not.toContain('{colors.nope}')
    expect(result.stylesheet).not.toContain(': colors\\.nope')
    expect(result.stylesheet).not.toContain('var(--colors-nope)')
    expect(result.stylesheet).toContain('border-width: 2px;')
    expect(result.stylesheet).toContain('border-style: solid;')
    expect(result.stylesheet).toContain('outline-color: var(--colors-gray-800);')
    // Braceless pin: `{}}` refuses its color longhand (surviving plan
    // keeps width+style) yet mints no class and no rule, so the
    // differential carves the namer's extra against the sheet.
    const refused = result.stylePlans?.find(
      p => p.prop === 'border' && p.value === '2px solid {}}'
    )
    expect(refused, 'surviving partial plan for the {}} border').toBeDefined()
    expect(refused!.declarations).toHaveLength(2)
    expect(result.stylesheet).not.toContain('{}}')
    expect(result.atomCount).toBe(3)
    const classKeys = Object.keys(result.css?.classes ?? {})
    const classValues = Object.values(result.css?.classes ?? {}).join(' ')
    expect(classKeys).toHaveLength(3)
    expect(classKeys.join(' ')).not.toContain('nope')
    expect(classValues).not.toContain('{}}')
  },
}

export default spec
