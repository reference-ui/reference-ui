/**
 * No-silence sweep station (ATM-SITE-50, Overmatch Ph1). Every non-object
 * css() arg and every _ => {} on a site path diagnoses with position and
 * keeps siblings; the silence controls stay quiet.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

interface ExpectedDiagnostic {
  file: string
  line: number
  code: string
  message: string
}

const EXPECTED_DIAGNOSTICS: ExpectedDiagnostic[] = [
  { file: 'args.ts', line: 10, code: 'ATM-W-NON-OBJECT-CSS-ARG', message: "css() argument 1 is not a static style object (identifier 'styles')" },
  { file: 'args.ts', line: 11, code: 'ATM-W-NON-OBJECT-CSS-ARG', message: 'css() argument 1 is not a static style object (member expression)' },
  { file: 'args.ts', line: 12, code: 'ATM-W-NON-OBJECT-CSS-ARG', message: 'css() argument 1 is not a static style object (call expression)' },
  { file: 'args.ts', line: 13, code: 'ATM-W-NON-OBJECT-CSS-ARG', message: 'css() argument 2 is not a static style object (logical expression)' },
  { file: 'args.ts', line: 14, code: 'ATM-W-NON-OBJECT-CSS-ARG', message: 'css() argument 1 is not a static style object (spread element)' },
  { file: 'branches.ts', line: 9, code: 'ATM-W-NON-OBJECT-CSS-ARG', message: "css() argument 1 is not a static style object (identifier 'styles')" },
  { file: 'branches.ts', line: 9, code: 'ATM-W-NON-OBJECT-CSS-ARG', message: "css() argument 1 is not a static style object (identifier 'other')" },
  { file: 'branches.ts', line: 11, code: 'ATM-W-NON-OBJECT-CSS-ARG', message: 'css() argument 1 is not a static style object (call expression)' },
  { file: 'tags.ts', line: 3, code: 'ATM-W-TAGGED-TEMPLATE-SITE', message: 'tagged template is not a css() site; use css({...})' },
  { file: 'jsx.tsx', line: 8, code: 'ATM-W-NON-OBJECT-JSX-STYLE', message: "JSX 'css' prop value is not a static style object (identifier 'styles')" },
  { file: 'jsx.tsx', line: 9, code: 'ATM-W-NON-OBJECT-JSX-STYLE', message: "JSX 'css' prop value is not a static style object (logical expression)" },
  { file: 'jsx.tsx', line: 10, code: 'ATM-W-NON-OBJECT-JSX-STYLE', message: "JSX '_hover' prop value is not a static style object (call expression)" },
  { file: 'jsx.tsx', line: 12, code: 'ATM-W-NON-OBJECT-JSX-STYLE', message: "JSX 'css' prop value is not a static style object (spread element)" },
]

// Sibling args, live arms, and the wrapped JSX block still extract.
const EXPECTED_WANTS: Array<{ prop: string; value: string }> = [
  { prop: 'color', value: 'green' },
  { prop: 'color', value: 'cyan' },
  { prop: 'color', value: 'pink' },
  { prop: 'color', value: 'teal' },
  { prop: 'color', value: 'navy' },
  { prop: 'color', value: 'lime' },
  { prop: 'color', value: 'blue' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-50',
  verify(result) {
    for (const { prop, value } of EXPECTED_WANTS) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // Green and pink each arrive twice (two sibling positions).
    expect(result.wants ?? []).toHaveLength(9)

    // Refused positions yield nothing: no margin from the logical arg, no
    // whole-object red/padding, no member blue, no spread teal.
    expect(hasWant(result, 'margin', '3r')).toBe(false)
    expect(hasWant(result, 'padding', '4px')).toBe(false)
    expect(hasWant(result, 'color', 'red')).toBe(false)

    // One runtime plan per unique surviving leaf.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(EXPECTED_WANTS.length)
    for (const { prop, value } of EXPECTED_WANTS) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    // Thirteen refusals, each located with its code and message.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(EXPECTED_DIAGNOSTICS.length)
    for (const expected of EXPECTED_DIAGNOSTICS) {
      const match = diagnostics.find(
        d => d.file?.endsWith(expected.file) && d.line === expected.line && d.message === expected.message,
      )
      expect(match, `missing ${expected.file}:${expected.line} ${expected.message}`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.code).toBe(expected.code)
      expect(match!.column).toBeDefined()
    }

    expect(result.stylesheet).not.toContain('margin: 3r')
    expect(result.stylesheet).toContain('color: cyan;')
  },
}

export default spec
