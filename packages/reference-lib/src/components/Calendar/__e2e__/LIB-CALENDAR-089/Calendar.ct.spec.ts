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
  test('CA-MODE-02: month mode publishes YYYY-MM; Year drill-down navigates without selecting', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/MonthMode')

    const calendar = page.getByTestId('test-mmonth-calendar')
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)

    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('mmonth-changes')).toHaveText('2024-06')
    await expect(page.getByTestId('mmonth-value')).toHaveText('2024-06')
    await expect(calendar.locator('button[data-month="2024-06"]')).toHaveAttribute(
      'data-selected',
      ''
    )

    // Re-activating the selected month is silent (month mode).
    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('mmonth-changes')).toHaveText('2024-06')

    // Year drill-down is navigation: requests 2020-04, selects nothing.
    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2020"]').click()
    await expect(page.getByTestId('mmonth-month-reqs')).toHaveText('2020-04')
    await expect(page.getByTestId('mmonth-changes')).toHaveText('2024-06')
    await page.getByTestId('mmonth-accept').click()
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(calendar.locator('button[data-month="2020-04"]')).toBeVisible()
  })
});
