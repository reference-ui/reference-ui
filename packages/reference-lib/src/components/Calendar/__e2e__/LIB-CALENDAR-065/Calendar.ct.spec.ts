/**
 * Calendar browser proofs: grid rendering, selection, navigation,
 * locale presentation, keyboard moves, and constrained states. Mounts
 * the story machines and asserts one-request-per-gesture discipline
 * with stable tab stops in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

// Landing-sequence engine scope: Safari/WebKit never delivers
// click-focus to buttons/links (mousedown blurs to body) and its native Tab
// order skips them, honoring text controls + explicit tabindex stops only.
// `engineOf` sniffs the Playwright project (`react19` on agentct Chromium,
// `react19-firefox`/`react19-webkit` on the sweep vehicle) so specs can
// compensate delivery or assert the deterministic platform outcome.
function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

test.describe('Calendar CT', () => {
  test('CA-MONTH-07/CA-SINGLE-07: outside activation requests month first, then the date', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await page.locator('button[data-date="2024-10-01"]').click()
    await expect(page.getByTestId('out-events')).toHaveText('m:2024-10,c:2024-10-01')
    await expect(page.getByTestId('out-heading')).toContainText('September 2024')

    await page.getByTestId('out-accept').click()
    await expect(page.getByTestId('out-heading')).toContainText('October 2024')
    await expect(page.locator('button[data-date="2024-10-01"]')).toBeFocused()
    await expect(page.locator('button[data-date="2024-10-01"]')).toHaveAttribute('tabindex', '0')
  })
});
