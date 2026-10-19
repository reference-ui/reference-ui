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
  test('CA-MONTH-02/05: controlled nav requests the adjacent month once with no optimistic render', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/MonthMachine')

    const heading = page.getByTestId('month-heading')
    const requests = page.getByTestId('month-requests')

    await expect(heading).toContainText('January 2024')
    await expect(requests).toHaveText('none')

    await page.getByTestId('month-next').click()
    await expect(requests).toHaveText('2024-02')
    await expect(heading).toContainText('January 2024')

    // A second gesture re-requests the same adjacent target; still January.
    await page.getByTestId('month-next').click()
    await expect(requests).toHaveText('2024-02,2024-02')
    await expect(heading).toContainText('January 2024')

    await page.getByTestId('month-accept').click()
    await expect(heading).toContainText('February 2024')
    await expect(requests).toHaveText('none')
  })
});
