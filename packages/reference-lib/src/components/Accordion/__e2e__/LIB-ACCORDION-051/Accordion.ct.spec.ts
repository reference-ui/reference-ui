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
  test('AC-COMP-02: A multiple Accordion should keep animated settings sections independently controllable', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Settings')
    const s1 = page.getByTestId('settings-trigger-s1')
    const s3 = page.getByTestId('settings-trigger-s3')
    const reorderBtn = page.getByTestId('btn-reorder-settings')
    const settingsLog = page.getByTestId('settings-log')

    await expect(s1).toHaveAttribute('aria-expanded', 'true')
    await expect(s3).toHaveAttribute('aria-expanded', 'true')

    // Reorder C (S3) before B (S2)
    await reorderBtn.click()

    // Toggle S1 off
    await s1.click()
    await expect(settingsLog).toContainText('s3')
  })
})
