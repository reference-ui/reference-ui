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

test.describe('Calendar month/year views (FEATURES #10)', () => {
  test('CA-VIEW-03: Year toggles the private year view and the day grid stands down', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/FoldedViews')

    const calendar = page.getByTestId('test-views-calendar')
    const yearBtn = calendar.locator('[data-reference-calendar-year]')
    const monthBtn = calendar.locator('[data-reference-calendar-month]')

    await yearBtn.click()
    await expect(calendar).toHaveAttribute('data-view', 'year')
    await expect(yearBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(monthBtn).toHaveAttribute('aria-pressed', 'false')
    await expect(calendar.locator('[data-reference-calendar-years]')).toBeVisible()
    await expect(calendar.locator('[role="grid"]')).toBeHidden()
    await expect(calendar.locator('[data-reference-calendar-months]')).toBeHidden()

    // Day-grid keyboard is not active while the year view is shown: arrows
    // from the header move nothing and request nothing.
    await yearBtn.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('views-changes')).toHaveText('none')
    await expect(page.getByTestId('views-month-reqs')).toHaveText('none')

    await yearBtn.click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(yearBtn).toHaveAttribute('aria-pressed', 'false')
  })
});
