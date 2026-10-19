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
  test('CA-KEY-01/05: arrows move by day and week, landing on unavailable days and stopping at bounds without wrapping', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('button[data-date="2024-04-09"]')).toBeFocused()

    // 04-11–13 unavailable but focusable: every Right lands in sequence.
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-11"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-13"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-14"]')).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(page.locator('button[data-date="2024-04-07"]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('button[data-date="2024-04-14"]')).toBeFocused()

    // Bounds stop movement: no wrap, no impossible month request.
    await page.locator('button[data-date="2024-04-05"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('button[data-date="2024-04-05"]')).toBeFocused()
    await page.locator('button[data-date="2024-04-20"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-20"]')).toBeFocused()
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')
    await expect(page.getByTestId('con-changes')).toHaveText('none')
  })
});
