/**
 * Radius-pair station (ATM-SHORT-09, RS-25). The six side shorthands copy
 * one value to both addressed corners; real properties (`borderRadius`,
 * corner longhands) pass through untouched. No dead pair property prints.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'
const CALC2 = 'calc(2 * var(--spacing-root))'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-09',
  verify(result) {
    expect(hasWant(result, 'borderTopRadius', '2r')).toBe(true)
    expect(hasWant(result, 'borderStartRadius', '2r')).toBe(true)
    expect(hasWant(result, 'borderEndRadius', '2r')).toBe(true)

    const sheet = result.stylesheet
    for (const corner of [
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-left-radius',
      'border-bottom-right-radius',
      'border-start-start-radius',
      'border-end-start-radius',
      'border-start-end-radius',
      'border-end-end-radius',
    ]) {
      expect(sheet).toContain(`${corner}: ${CALC2};`)
    }
    for (const dead of [
      'border-top-radius:',
      'border-right-radius:',
      'border-bottom-radius:',
      'border-left-radius:',
      'border-start-radius:',
      'border-end-radius:',
    ]) {
      expect(sheet).not.toContain(dead)
    }
    // Real-property controls pass through.
    expect(sheet).toContain('border-radius: var(--spacing-root);')
    expect(sheet).toContain('border-top-left-radius: calc(3 * var(--spacing-root));')

    const classes = result.css?.classes ?? {}
    expect(classes['borderTopLeftRadius:2r']).toBe(`${SYSTEM}__rounded-tl_2r`)
    expect(classes['borderStartStartRadius:2r']).toBe(
      `${SYSTEM}__border-start-start-radius_2r`,
    )
    expect(classes['borderEndEndRadius:2r']).toBe(
      `${SYSTEM}__border-end-end-radius_2r`,
    )
    expect(Object.keys(classes).some(k => k.startsWith('borderTopRadius:'))).toBe(false)

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
