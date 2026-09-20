/**
 * Whole-object / member-arg station (ATM-SITE-50, Overmatch Ph1+Ph3). An
 * argument that folds to an object extracts exactly as if spread —
 * identifiers, single-hop members, conditional arms, and logical operands
 * over const objects — while an argument that does not fold diagnoses with
 * its position and keeps sibling args.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

interface ExpectedDiagnostic {
  file: string
  line: number
  code: string
  message: string
}

const EXPECTED_DIAGNOSTICS: ExpectedDiagnostic[] = [
  // args.ts: calls, scalars, missing names, and deep members refuse; the
  // logical left operands refuse while their object rights still lower.
  {
    file: 'args.ts',
    line: 24,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: 'css() argument 1 is not a static style object (call expression)',
  },
  {
    file: 'args.ts',
    line: 25,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: "css() argument 1 is not a static style object (identifier 'count')",
  },
  {
    file: 'args.ts',
    line: 26,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: "css() argument 1 is not a static style object (identifier 'missing')",
  },
  {
    file: 'args.ts',
    line: 27,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: 'css() argument 1 is not a static style object (member expression)',
  },
  {
    file: 'args.ts',
    line: 28,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: 'css() argument 1 is not a static style object (member expression)',
  },
  {
    file: 'args.ts',
    line: 29,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: "css() argument 2 is not a static style object (identifier 'cond')",
  },
  {
    file: 'args.ts',
    line: 30,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: "css() argument 1 is not a static style object (identifier 'missing')",
  },
  {
    file: 'args.ts',
    line: 31,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: "css() argument 1 is not a static style object (identifier 'yes')",
  },
  {
    file: 'args.ts',
    line: 33,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: 'css() argument 1 is not a static style object (spread element)',
  },
  {
    file: 'args.ts',
    line: 42,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: "css() argument 1 is not a static style object (identifier 'styles')",
  },
  // branches.ts: the dynamic logical left and the call arm refuse.
  {
    file: 'branches.ts',
    line: 13,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: "css() argument 1 is not a static style object (identifier 'ok')",
  },
  {
    file: 'branches.ts',
    line: 15,
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    message: 'css() argument 1 is not a static style object (call expression)',
  },
  // tags.ts: the live tag diagnoses; the dead tag stays silent.
  {
    file: 'tags.ts',
    line: 3,
    code: 'ATM-W-TAGGED-TEMPLATE-SITE',
    message: 'tagged template is not a css() site; use css({...})',
  },
  // jsx.tsx: the logical left and the call condition refuse. The literal
  // spread element flattens silently (SPEC-V2-28 Ph3, sibling slice).
  {
    file: 'jsx.tsx',
    line: 14,
    code: 'ATM-W-NON-OBJECT-JSX-STYLE',
    message: "JSX 'css' prop value is not a static style object (identifier 'cond')",
  },
  {
    file: 'jsx.tsx',
    line: 15,
    code: 'ATM-W-NON-OBJECT-JSX-STYLE',
    message: "JSX '_hover' prop value is not a static style object (call expression)",
  },
]

// Every unique surviving leaf: whole objects, members, arms, and logical
// rights lower; the mutated stale init and the refused positions emit nothing.
const EXPECTED_WANTS: Array<{ prop: string; value: string; when?: string[] }> = [
  { prop: 'color', value: 'red' },
  { prop: 'padding', value: '4px' },
  { prop: 'color', value: 'blue' },
  { prop: 'color', value: 'aqua' },
  { prop: 'color', value: 'beige' },
  { prop: 'color', value: 'green' },
  { prop: 'margin', value: '3r' },
  { prop: 'padding', value: '2r' },
  { prop: 'color', value: 'plum' },
  { prop: 'color', value: 'olive' },
  { prop: 'color', value: 'cyan' },
  { prop: 'margin', value: '1r' },
  { prop: 'color', value: 'teal' },
  { prop: 'color', value: 'indigo' },
  { prop: 'color', value: 'violet' },
  { prop: 'color', value: 'magenta' },
  { prop: 'color', value: 'pink' },
  { prop: 'color', value: 'navy' },
  { prop: 'color', value: 'lime' },
  { prop: 'color', value: 'coral' },
  { prop: 'color', value: 'coral', when: ['_hover'] },
  { prop: 'color', value: 'maroon', when: ['_hover'] },
  { prop: 'color', value: 'salmon' },
  // compose.ts: alias-chain whole object + destructured-rest whole object.
  { prop: 'color', value: 'gold' },
  { prop: 'padding', value: '11px' },
  { prop: 'padding', value: '12px' },
  { prop: 'margin', value: '13px' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-50',
  async verify(result) {
    for (const { prop, value, when } of EXPECTED_WANTS) {
      expect(hasWant(result, prop, value, when ?? [])).toBe(true)
    }
    // Whole-object and wrapped twins arrive twice each, as do the
    // cross-file red/blue/green/cyan/teal/pink leaves; the flattened
    // literal spread adds one more teal, the const-true logical one salmon.
    // The compose.ts alias-chain and rest arms add four unique leaves.
    expect(result.wants ?? []).toHaveLength(39)

    // Refused positions yield nothing: no stale crimson, and nothing
    // under _hover from the refused call condition. The destructured-away
    // rest color never leaks into the rest arg.
    expect(hasWant(result, 'color', 'crimson')).toBe(false)
    expect(hasWant(result, 'color', 'khaki')).toBe(false)
    expect(hasWant(result, 'color', 'pink', ['_hover'])).toBe(false)

    // One runtime plan per unique leaf.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(EXPECTED_WANTS.length)
    for (const { prop, value } of EXPECTED_WANTS) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    // Fifteen positioned refusals plus the mutated-arg write-naming
    // warning — on the opt-in channel now (S6 E8-class re-point); the
    // default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-50', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const diagnostics = (opted.compilerDiagnostics ?? []).filter(
      d => d.severity === 'warning'
    )
    expect(diagnostics).toHaveLength(EXPECTED_DIAGNOSTICS.length + 1)
    for (const expected of EXPECTED_DIAGNOSTICS) {
      const match = diagnostics.find(
        d =>
          d.file?.endsWith(expected.file) &&
          d.line === expected.line &&
          d.message === expected.message
      )
      expect(
        match,
        `missing ${expected.file}:${expected.line} ${expected.message}`
      ).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.code).toBe(expected.code)
      expect(match!.column).toBeDefined()
    }
    const mutated = diagnostics.find(
      d =>
        d.file?.endsWith('args.ts') &&
        d.message.includes("Dynamic mutated binding 'dying'")
    )
    expect(mutated, 'missing mutated-args.ts:34 diagnostic').toBeDefined()
    expect(mutated!.severity).toBe('warning')
    expect(mutated!.code).toBe('ATM-W-MUTATED-BINDING')
    expect(mutated!.line).toBe(34)
    expect(mutated!.message).toContain('reassigned at')
    expect(mutated!.message).toContain('args.ts:17:1')
    expect(mutated!.message).toContain('keeping sibling args')

    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('color: aqua;')
    expect(result.stylesheet).toContain('color: beige;')
    expect(result.stylesheet).toContain('color: gold;')
    expect(result.stylesheet).toContain('padding: 11px;')
    expect(result.stylesheet).toContain('padding: 12px;')
    expect(result.stylesheet).toContain('margin: 13px;')
    expect(result.stylesheet).toContain('margin: calc(3 * var(--spacing-root));')
    expect(result.stylesheet).toContain('margin: var(--spacing-root);')
    expect(result.stylesheet).not.toContain('crimson')
    expect(result.stylesheet).not.toContain('khaki')
  },
}

export default spec
