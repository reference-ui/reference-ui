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
  test('CA-VIEW-01: folded day Calendar is complete with Month/Year drill-down and the day grid home', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/FoldedViews')

    const calendar = page.getByTestId('test-views-calendar')
    await expect(calendar).toHaveAttribute('data-mode', 'day')
    await expect(calendar).toHaveAttribute('data-view', 'day')

    const header = calendar.locator('[data-reference-calendar-header]')
    await expect(header.getByRole('button', { name: 'March 2024' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'May 2024' })).toBeVisible()
    const monthBtn = calendar.locator('[data-reference-calendar-month]')
    const yearBtn = calendar.locator('[data-reference-calendar-year]')
    await expect(monthBtn).toHaveText('April')
    await expect(monthBtn).toHaveAttribute('aria-pressed', 'false')
    await expect(yearBtn).toHaveText('2024')
    await expect(yearBtn).toHaveAttribute('aria-pressed', 'false')

    // Day Grid is the sole collection in the accessibility tree.
    await expect(calendar.locator('[role="grid"]')).toBeVisible()
    await expect(calendar.locator('[data-reference-calendar-months]')).toBeHidden()
    await expect(calendar.locator('[data-reference-calendar-years]')).toBeHidden()
  })
});
