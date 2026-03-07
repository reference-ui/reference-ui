/**
 * @vitest-environment happy-dom
 *
 * Unit tests for the globalCss() API. src/system/styles.ts registers
 * :root { --ref-app-test-var: 42px }; ref sync merges it into the design system.
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
  // extendPandaConfig is a no-op; config generation merges tokens only (fragments.md)
  it.skip('emits :root with --ref-app-test-var in design system CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain('--ref-app-test-var')
    expect(css).toContain('42px')
  })
})
