/**
 * Tree composition gates and browser proofs. Pins hierarchy rendering,
 * controlled selection and expansion with deterministic emission, APG
 * keyboard traversal with RTL mirroring, typeahead over the visible set,
 * dynamic recovery, Combobox bridge commits and virtual focus, ShadowRoot
 * traversal, and an accessibility-clean sweep.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Tree parity', () => {
  test('TR-CSS-01: Tree branch focus ring should resolve to a real token with no template placeholder', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Basic')
    const folder = page.getByTestId('tree-item-folder-1')
    await expect(folder).toBeVisible()

    // the branch focus rule must exist in the injected sheet AND be
    // fully resolved — a literal {colors…} theme placeholder in a
    // component-level css() value ships verbatim and is unresolvable.
    const probe = await page.evaluate(() => {
      const matching: string[] = []
      const offenders: string[] = []
      const placeholderRe = /\{[a-zA-Z][\w-]*(\.[\w-]+)+\}/g
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList
        try {
          rules = sheet.cssRules
        } catch {
          continue
        }
        for (const rule of Array.from(rules)) {
          const text = rule.cssText
          if (text.includes('data-slot') && text.includes('focus-visible')) {
            matching.push(text)
            if (placeholderRe.test(text)) offenders.push(text)
            placeholderRe.lastIndex = 0
          }
        }
      }
      return { matching, offenders }
    })
    expect(probe.matching.length).toBeGreaterThan(0)
    expect(probe.matching.some((text) => text.includes('outline-color'))).toBe(true)
    expect(probe.offenders).toEqual([])
  })
});
