/**
 * Tagged-template refusal station. css`…` on the live binding produces no
 * wants plus one located diagnostic per tag; non-css tags stay silent,
 * while the neighbouring object call still extracts.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-12',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.wants ?? []).toHaveLength(1)

    // Both live `css` tags diagnose; the `styled.div` tag stays silent.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(2)
    for (const diag of diagnostics) {
      expect(diag.severity).toBe('warning')
      expect(diag.code).toBe('ATM-W-TAGGED-TEMPLATE-SITE')
      expect(diag.message).toBe('tagged template is not a css() site; use css({...})')
      expect(diag.file).toMatch(/App\.tsx$/)
      expect(diag.line).toBeDefined()
      expect(diag.column).toBeDefined()
    }
    expect(diagnostics.map(d => d.line).sort()).toEqual([3, 7])

    expect(result.stylesheet).not.toContain('color: red;')
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(1)
  },
}

export default spec
