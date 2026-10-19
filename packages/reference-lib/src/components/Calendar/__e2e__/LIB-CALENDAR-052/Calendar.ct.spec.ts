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
  test('CA-MONTH-09/10: omitted month follows value, keeps user nav while mounted, reseeds on remount', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/UncontrolledMonth')

    const heading = page.getByTestId('unc-heading')
    const value = page.getByTestId('unc-value')

    await expect(heading).toContainText('September 2024')
    await expect(value).toHaveText('2024-09-18')

    // User navigation commits internally without emitting onChange.
    await page.getByTestId('unc-next').click()
    await expect(heading).toContainText('October 2024')
    await expect(value).toHaveText('2024-09-18')

    // Hide without unmounting keeps the pane.
    await page.getByTestId('unc-hide').click()
    await page.getByTestId('unc-show').click()
    await expect(heading).toContainText('October 2024')

    // Remount reseeds from value.
    await page.getByTestId('unc-unmount').click()
    await page.getByTestId('unc-remount').click()
    await expect(heading).toContainText('September 2024')

    // A new value re-seats the pane.
    await page.getByTestId('unc-set-april').click()
    await expect(heading).toContainText('April 2024')
    await expect(value).toHaveText('2024-04-10')
  })
});
