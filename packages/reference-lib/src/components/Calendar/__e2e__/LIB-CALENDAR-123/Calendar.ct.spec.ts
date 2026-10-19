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

test.describe('Calendar view defaulting + environments (VIEW-13, DAY-14, ENV)', () => {
  test('CA-VIEW-13 (first fixture): a custom Days renderer keeps the default Header/Months/Years and drill-down', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/View13CustomDays')

    const calendar = page.getByTestId('test-v13-calendar')
    // Per-part defaulting: the authored Grid gains the default header.
    await expect(calendar.locator('[data-reference-calendar-month]')).toHaveCount(1)
    await expect(calendar.locator('[data-reference-calendar-year]')).toHaveCount(1)
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(page.getByTestId('v13-custom-2024-04-10')).toHaveText('custom-10')

    // Drill-down still works through the defaulted Months part.
    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(calendar.locator('button[data-month="2024-06"]')).toBeVisible()
    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('v13-month-reqs')).toHaveText('2024-06')
    await page.getByTestId('v13-accept-month').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(page.getByTestId('v13-custom-2024-06-01')).toHaveText('custom-1')
    await expect(page.getByTestId('v13-value')).toHaveText('2024-04-10')
  })
});
