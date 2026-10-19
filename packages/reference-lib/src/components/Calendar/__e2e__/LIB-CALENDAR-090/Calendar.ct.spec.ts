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
  test('CA-MODE-03: year mode publishes YYYY and Month/Year never reveal a day table', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/YearMode')

    const calendar = page.getByTestId('test-ymode-calendar')
    await expect(calendar).toHaveAttribute('data-view', 'year')
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)
    await expect(calendar.locator('[data-reference-calendar-months]')).toHaveCount(0)

    await calendar.locator('button[data-year="2026"]').click()
    await expect(page.getByTestId('ymode-changes')).toHaveText('2026')
    await expect(page.getByTestId('ymode-value')).toHaveText('2026')

    // Re-activating the selected year is silent (year mode).
    await calendar.locator('button[data-year="2026"]').click()
    await expect(page.getByTestId('ymode-changes')).toHaveText('2026')

    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)
    await calendar.locator('[data-reference-calendar-year]').click()
    await expect(calendar).toHaveAttribute('data-view', 'year')
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)
  })
});
