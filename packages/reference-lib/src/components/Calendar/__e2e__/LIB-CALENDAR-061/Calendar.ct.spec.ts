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
  test('CA-KEY-02: Home/End reach locale week boundaries, landing on unavailable boundaries and skipping inward past out-of-bounds dates', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-16"]').focus()
    await page.keyboard.press('Home')
    await expect(page.locator('button[data-date="2024-04-14"]')).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.locator('button[data-date="2024-04-20"]')).toBeFocused()

    // End boundary 04-13 is unavailable but focusable: End lands on it.
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('End')
    await expect(page.locator('button[data-date="2024-04-13"]')).toBeFocused()
    await page.keyboard.press('Home')
    await expect(page.locator('button[data-date="2024-04-07"]')).toBeFocused()

    // Out-of-bounds boundary dates still skip inward: Home from 04-05
    // walks 03-31 inward through 04-01–04 and stays on the origin.
    await page.locator('button[data-date="2024-04-05"]').focus()
    await page.keyboard.press('Home')
    await expect(page.locator('button[data-date="2024-04-05"]')).toBeFocused()
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')
  })
});
