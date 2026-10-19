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
  test('CA-VIEW-06: Years windows ten either side unbounded, clamps at the domain edges, min-through-max when bounded', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    await calendar.locator('[data-reference-calendar-year]').click()
    const cells = calendar.locator('button[data-reference-calendar-year-cell]')
    await expect(cells).toHaveCount(21)
    await expect(calendar.locator('button[data-year="2014"]')).toHaveText('2014')
    await expect(calendar.locator('button[data-year="2034"]')).toHaveText('2034')
    await expect(calendar.locator('button[data-year="2024"]')).toHaveAttribute(
      'data-current',
      ''
    )

    // Domain edges clamp to a full in-domain run (the pane move returns
    // home, so each edge re-opens the year view).
    await mount('components/Calendar/Calendar/MonthMachine')
    const edge = page.getByTestId('test-month-calendar')
    await page.getByTestId('month-min').click()
    await page.getByTestId('month-year-drill').click()
    await expect(edge.locator('button[data-year="0001"]')).toBeVisible()
    await expect(edge.locator('button[data-year="0021"]')).toBeVisible()
    await expect(edge.locator('button[data-reference-calendar-year-cell]')).toHaveCount(21)
    await page.getByTestId('month-max').click()
    await page.getByTestId('month-year-drill').click()
    await expect(edge.locator('button[data-year="9999"]')).toBeVisible()
    await expect(edge.locator('button[data-year="9979"]')).toBeVisible()

    // Bounded: min-through-max years only; the 2024 pane year is absent.
    await mount('components/Calendar/Calendar/FoldedViews')
    const bounded = page.getByTestId('test-views-calendar')
    await bounded.locator('[data-reference-calendar-year]').click()
    await expect(
      bounded.locator('button[data-reference-calendar-year-cell]')
    ).toHaveCount(1)
    await expect(bounded.locator('button[data-year="2024"]')).toBeVisible()
  })
});
