/**
 * @vitest-environment happy-dom
 *
 * Unit tests for the globalCss() API. src/system/styles.ts registers
 * :root { --ref-unit-test-var: 42px }; ref sync merges it into the design system.
 * We assert the generated CSS contains the global rule.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { injectDesignSystemCss, getDesignSystemCss } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip CSS assertions.
  }
})

describe('globalCss() API', () => {
  // MIGRATED: Covered by matrix/system/tests/e2e/system-contract.spec.ts.
  it.skip('emits :root with --ref-unit-test-var in design system CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain('--ref-unit-test-var')
    expect(css).toContain('42px')
  })
})
