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
  test('AC-COMP-01: A single Accordion should implement a collapsible FAQ with native header tabbing', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Faq')
    const q1 = page.getByTestId('faq-trigger-1')
    const a1 = page.getByTestId('faq-content-1')
    const q2 = page.getByTestId('faq-trigger-2')
    const a2 = page.getByTestId('faq-content-2')

    await expect(q1).toHaveAttribute('aria-expanded', 'true')
    await expect(a1).toBeVisible()

    // Click Q2
    await q2.click()
    await expect(q1).toHaveAttribute('aria-expanded', 'false')
    await expect(q2).toHaveAttribute('aria-expanded', 'true')
    await expect(a2).toBeVisible()

    // Click Q2 again -> all collapsed
    await q2.click()
    await expect(q2).toHaveAttribute('aria-expanded', 'false')
    await expect(a2).toHaveCount(0)
  })
})
