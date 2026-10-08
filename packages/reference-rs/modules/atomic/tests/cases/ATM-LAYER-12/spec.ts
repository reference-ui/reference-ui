/**
 * Top-level-at-rule station (ATM-LAYER-12, RS-27). At-rule keys at the top
 * of `globalCss` brace their inner selectors; stacked at-rules nest in
 * author order. In-selector nesting is the unchanged control.
 */
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-12',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain(
      '@media (min-width: 640px) {\n    body, :root { color: red }\n  }',
    )
    const supports = sheet.indexOf('@supports (display: grid) {')
    const media = sheet.indexOf('@media (min-width: 640px) {', supports)
    const rule = sheet.indexOf('body { color: blue }', media)
    expect(supports).toBeGreaterThan(-1)
    expect(media).toBeGreaterThan(supports)
    expect(rule).toBeGreaterThan(media)
    expect(sheet).toContain(
      '@media (min-width: 640px) {\n    body { color: green }\n  }',
    )
    expect(sheet).not.toContain('@media (min-width: 640px) body')

    // Bare `@supports` carries no query: refused, never printed braceless.
    expect(sheet.match(/@supports \(display: grid\) \{/g)).toHaveLength(1)
    expect(sheet).not.toContain('color: gray')
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        message: 'Empty at-rule query in global CSS: "@supports"',
      }),
    ])
  },
}

export default spec
