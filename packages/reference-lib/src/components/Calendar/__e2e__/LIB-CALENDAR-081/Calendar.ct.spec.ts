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
  test('CA-VIEW-07: an enabled year cell navigates preserving the month number', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2020"]').click()
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('2020-04')
    await expect(calendar).toHaveAttribute('data-view', 'year')

    await page.getByTestId('cviews-accept').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(calendar.locator('button[data-date="2020-04-01"]')).toBeVisible()

    // February stays February across the year jump.
    await calendar.locator('[data-reference-calendar-month]').click()
    await calendar.locator('button[data-month="2020-02"]').click()
    await page.getByTestId('cviews-accept').click()
    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2023"]').click()
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('2023-02')
  })
});
