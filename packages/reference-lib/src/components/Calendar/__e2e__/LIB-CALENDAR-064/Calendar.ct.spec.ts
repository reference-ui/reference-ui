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
  test('CA-KEY-07: cross-month keyboard focus waits for the controlled month', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await page.locator('button[data-date="2024-09-30"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('out-month-reqs')).toHaveText('2024-10')
    await expect(page.locator('button[data-date="2024-09-30"]')).toBeFocused()

    // Rejection keeps September; the repeat request is identical.
    await page.getByTestId('out-reject').click()
    await page.locator('button[data-date="2024-09-30"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('out-month-reqs')).toHaveText('2024-10')

    await page.getByTestId('out-accept').click()
    await expect(page.getByTestId('out-heading')).toContainText('October 2024')
    await expect(page.locator('button[data-date="2024-10-01"]')).toBeFocused()
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('out-changes')).toHaveText('none')
  })
});
