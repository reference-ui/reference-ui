/**
 * Cross-file fold station (Forge §1). A nested import spread folds across
 * three files, named imports resolve through an `export *` barrel, a value
 * chase that cycles keeps its literal siblings with one located
 * `ATM-W-UNFOLDABLE-SPREAD` naming the cycle, and an inner origin refused
 * mid-chase still folds on later direct use (cycle refusals never memoize).
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-78',
  verify(result) {
    // The §1 three-file fold: base rides into button beside its sibling.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    // The star barrel: button and the leaf badge resolve through `export *`.
    expect(hasWant(result, 'margin', '2px')).toBe(true)
    // The cycle arm: each side keeps its own literal.
    expect(hasWant(result, 'margin', '8px')).toBe(true)
    expect(hasWant(result, 'padding', '6px')).toBe(true)
    // The inner-origin arm: `zest` was refused mid-chase while its file was
    // mid-refinement, but the refusal never memoized, so direct use folds.
    expect(hasWant(result, 'color', 'chartreuse')).toBe(true)

    // Direct, barreled, leaf, cycled, and inner uses: eight wants, no more.
    expect(result.wants ?? []).toHaveLength(8)

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')
    expect(sheet).toContain('padding: 4px;')
    expect(sheet).toContain('margin: 2px;')
    expect(sheet).toContain('color: chartreuse;')

    // The only diagnostic is the cycle arm's residue marker, located at
    // the use site and naming the origin spread and the cycle.
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-UNFOLDABLE-SPREAD',
        message:
          'spread of `aye` in cycle-b.ts:3 could not be read (cycle cycle-a.ts ↔ cycle-b.ts)',
      }),
    ])
  },
}

export default spec
