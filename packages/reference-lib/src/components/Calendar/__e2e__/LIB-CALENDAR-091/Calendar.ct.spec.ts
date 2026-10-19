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
  test('CA-VIEW-13 (second fixture): a custom header without Month/Year has no drill-down and stays in day view', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/SingleDate')

    const calendar = page.getByTestId('test-calendar')
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(calendar.locator('[data-reference-calendar-month]')).toHaveCount(0)
    await expect(calendar.locator('[data-reference-calendar-year]')).toHaveCount(0)
    await expect(calendar.locator('[role="grid"]')).toBeVisible()
    // The first CA-VIEW-13 fixture (custom Days renderer + defaulted
    // Header/Months/Years) is proven in the day-parts suite below.
  })
});
