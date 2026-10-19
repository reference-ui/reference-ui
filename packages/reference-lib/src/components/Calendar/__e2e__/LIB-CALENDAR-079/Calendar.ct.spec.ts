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
  test('CA-VIEW-05/CA-MODE-01: an enabled month cell navigates and returns to day view only after the month is accepted', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    await expect(calendar).toHaveAttribute('data-mode', 'day')
    await calendar.locator('[data-reference-calendar-month]').click()

    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('2024-06')
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')
    // Navigation only: the view waits for the controlled month.
    await expect(calendar).toHaveAttribute('data-view', 'month')

    await page.getByTestId('cviews-accept').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(calendar.locator('button[data-date="2024-06-01"]')).toBeVisible()
    await expect(page.getByTestId('cviews-value')).toHaveText('2024-04-10')
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')

    // A disabled month cell emits nothing in any callback.
    await mount('components/Calendar/Calendar/FoldedViews')
    const bounded = page.getByTestId('test-views-calendar')
    await bounded.locator('[data-reference-calendar-month]').click()
    await bounded.locator('button[data-month="2024-01"]').click({ force: true })
    await expect(page.getByTestId('views-month-reqs')).toHaveText('none')
    await expect(page.getByTestId('views-changes')).toHaveText('none')
    await expect(bounded).toHaveAttribute('data-view', 'month')
  })
});
