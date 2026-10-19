/**
 * Accordion browser proofs: composition gates plus the AC-DOM, AC-KEY,
 * AC-NEST, AC-PRES, AC-A11Y, AC-COMP, and AC-FIND-CT case rows. Mounts the
 * story fixtures and asserts expansion, traversal, nesting, and presence
 * in a real browser with axe checks on the accessibility rows.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

// Landing-sequence engine scope: `engineOf` sniffs the Playwright project
// (`react19` on agentct Chromium, `react19-firefox`/`react19-webkit` on the
// sweep vehicle) for per-engine delivery/expectations.
function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

test.describe('Accordion Composition Gates & Browser Proofs', () => {
  test('AC-COMP-03: Accordion should scope header traversal to the outer group that enables it in nested disclosure compositions', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Scope')
    const outer1 = page.getByTestId('scope-outer-trigger-1')
    const outer2 = page.getByTestId('scope-outer-trigger-2')
    const inner1 = page.getByTestId('scope-inner-trigger-1')
    const standalone = page.getByTestId('scope-standalone-trigger')

    // Outer arrow navigation skips inner items
    await outer1.focus()
    await page.keyboard.press('ArrowDown')
    await expect(outer2).toBeFocused()

    // Inner arrows do not move focus (keyboard="none")
    await inner1.focus()
    await page.keyboard.press('ArrowDown')
    await expect(inner1).toBeFocused()

    // Standalone collapsible toggles independently
    await standalone.click()
    await expect(standalone).toHaveAttribute('aria-expanded', 'true')
    await expect(outer1).toHaveAttribute('aria-expanded', 'true')
  })
})
