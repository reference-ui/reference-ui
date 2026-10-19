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
  test('CA-VIEW-02: Month toggles the private month view; consumer preventDefault cancels it', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/FoldedViews')

    const calendar = page.getByTestId('test-views-calendar')
    const monthBtn = calendar.locator('[data-reference-calendar-month]')

    await monthBtn.click()
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(monthBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(calendar.locator('[data-reference-calendar-months]')).toBeVisible()
    await expect(calendar.locator('[role="grid"]')).toBeHidden()
    await expect(calendar.locator('[data-reference-calendar-years]')).toBeHidden()
    await expect(page.getByTestId('views-changes')).toHaveText('none')
    await expect(page.getByTestId('views-month-reqs')).toHaveText('none')

    await monthBtn.click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(monthBtn).toHaveAttribute('aria-pressed', 'false')
    await expect(calendar.locator('[role="grid"]')).toBeVisible()

    // Consumer onClick runs first; preventDefault() cancels the toggle.
    await mount('components/Calendar/Calendar/BareHeadingViews')
    const bare = page.getByTestId('test-bare-calendar')
    await page.getByTestId('bare-veto').click()
    await page.getByTestId('bare-month').click()
    await expect(bare).toHaveAttribute('data-view', 'day')
    await page.getByTestId('bare-veto').click()
    await page.getByTestId('bare-month').click()
    await expect(bare).toHaveAttribute('data-view', 'month')
  })
});
