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
  test('CA-MONTH-04: nav disables at the 0001/9999 domain bounds', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/MonthMachine')

    const prev = page.getByTestId('month-prev')
    const next = page.getByTestId('month-next')
    const requests = page.getByTestId('month-requests')

    await expect(prev).toBeEnabled()
    await expect(next).toBeEnabled()

    await page.getByTestId('month-min').click()
    await expect(page.getByTestId('month-heading')).toContainText('January')
    await expect(page.locator('button[data-date="0001-01-01"]')).toBeVisible()
    await expect(prev).toBeDisabled()
    await expect(next).toBeEnabled()

    await page.getByTestId('month-max').click()
    await expect(page.getByTestId('month-heading')).toContainText('December 9999')
    await expect(next).toBeDisabled()
    await expect(prev).toBeEnabled()
    await expect(requests).toHaveText('none')
  })
});
