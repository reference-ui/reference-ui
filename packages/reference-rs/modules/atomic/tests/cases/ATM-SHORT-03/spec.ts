/**
 * Border zero/whole station. `0` / `0px` become width 0px. `none`, `inherit`,
 * and `borders.card` stay a single border atom.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-03',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('border-width: 0px;')
    expect(sheet).toContain('border: none;')
    expect(sheet).toContain('border: inherit;')
    expect(sheet).toContain('border: borders.card;')
    expect(sheet).not.toContain('var(--borders-card)')
    expect(sheet.toLowerCase()).not.toContain('currentcolor')
    // Token kinds behind the scalar gate: `token('none')` on `outline`
    // passes through whole (one decl, no ring emit), the red path
    // agrees as the control, so the runtime namer must pass both
    // through too (NEO-NAMER-01).
    const nonePlan = result.stylePlans.find(
      p =>
        p.prop === 'outline' &&
        (p.value as { $token?: { path?: string } })?.$token?.path === 'none'
    )
    expect(nonePlan?.declarations).toHaveLength(1)
    expect(nonePlan?.declarations[0]?.className).toBe(
      '@reference-ui/lib__outline_none'
    )
    expect(result.css?.classes?.['outline:none']).toBe(
      '@reference-ui/lib__outline_none'
    )
    expect(result.css?.classes?.['outline:colors.red.500']).toBe(
      '@reference-ui/lib__outline_colors.red.500'
    )
    expect(sheet).not.toContain('2px solid transparent')
  },
}

export default spec
