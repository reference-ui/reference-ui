/**
 * Global-breakpoint station (ATM-LAYER-13, RS-28 + tails-c). Breakpoint
 * keys lower through the scale's `@media` query, including `*Only` /
 * `*Down` / `*To*` ranges with the utility `@container` bounds retargeted
 * to `@media`; conditional values print `base` bare with breakpoint members
 * under queries and `_` members scoped. Unknown conditional keys refuse
 * with a diagnostic, never descendant selectors.
 */
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-13',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('.btn { width: 40px; line-height: 2; margin: 0 }')
    expect(sheet).toContain(
      '@media (min-width: 1024px) {\n    .btn { width: 90px }\n  }',
    )
    expect(sheet).toContain(
      '@media (min-width: 640px) {\n    .btn { font-size: 12px }\n  }',
    )
    expect(sheet).toContain('[data-color-mode=dark] .btn { margin: 8px }')
    expect(sheet).toContain(
      '@media (min-width: 640px) and (max-width: 767.98px) {\n    .btn { border-width: 2px }\n  }',
    )
    expect(sheet).toContain(
      '@media (max-width: 767.98px) {\n    .btn { margin: 6px }\n  }',
    )
    expect(sheet).not.toContain('.btn width')
    expect(sheet).not.toContain('.btn sm')
    expect(sheet).not.toContain('.btn smOnly')
    expect(sheet).not.toContain('.btn base')
    expect(sheet).not.toContain('nope')

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        message: 'Unknown conditional key "nope" for "margin" in global CSS',
      }),
    ])
  },
}

export default spec
