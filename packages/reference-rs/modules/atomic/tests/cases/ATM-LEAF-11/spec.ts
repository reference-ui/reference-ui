/**
 * Responsive-leaf refusal station. `!` on a responsive-object leaf warns
 * `ATM-W-RESPONSIVE-LEAF-IMPORTANT` on default naming prop + leaf, pushes
 * no want (no orphan `!` class), and serves the stripped value through the
 * non-important plan as a diagnosed fallback. Siblings still extract.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-11',
  verify(result) {
    const diags = result.diagnostics ?? []
    expect(diags).toHaveLength(1)
    expect(diags[0]?.code).toBe('ATM-W-RESPONSIVE-LEAF-IMPORTANT')
    expect(diags[0]?.severity).toBe('warning')
    expect(diags[0]?.message).toContain("'width'")
    expect(diags[0]?.message).toContain("'base'")
    expect(diags[0]?.file).toBeTruthy()
    expect(diags[0]?.line).toBeGreaterThan(0)

    const width = getWantsForProp(result, 'width')
    expect(width.every(w => w.important === false)).toBe(true)
    expect(hasWant(result, 'width', '60px', ['md'])).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)

    const classes = Object.values(result.css?.classes ?? {})
    expect(classes).toContain('@reference-ui/lib__w_50px')
    expect(classes).not.toContain('@reference-ui/lib__w_50px!')
    expect(result.stylesheet).toContain('width: 50px;')
    expect(result.stylesheet).not.toContain('50px !important')
  },
}

export default spec
