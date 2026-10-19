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
  test('AC-PRES-01: A single Accordion should expose only the new item as expanded while the old Content completes its exit', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/PresenceStory')
    const triggerA = page.getByTestId('pres-trigger-a')
    const contentA = page.getByTestId('pres-content-a')
    const triggerB = page.getByTestId('pres-trigger-b')
    const contentB = page.getByTestId('pres-content-b')
    const log = page.getByTestId('pres-log')

    await expect(triggerA).toHaveAttribute('aria-expanded', 'true')
    await expect(contentA).toBeVisible()

    await triggerB.click()

    // Request emitted and committed: B expanded, A not, B panel mounted
    await expect(log).toHaveText('b')
    await expect(triggerB).toHaveAttribute('aria-expanded', 'true')
    await expect(triggerA).toHaveAttribute('aria-expanded', 'false')
    await expect(contentB).toBeVisible()

    // A unmounts after exit finishes
    await expect(contentA).toHaveCount(0, { timeout: 3000 })
  })
})
