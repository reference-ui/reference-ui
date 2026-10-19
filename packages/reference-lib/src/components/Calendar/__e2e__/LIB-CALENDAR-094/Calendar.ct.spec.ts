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

test.describe('Calendar custom days + week start', () => {
  test('firstDayOfWeek overrides the locale default in both directions', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/WeekStartOverride')

    const usHeaders = page.getByTestId('ws-us-grid').locator('th')
    await expect(usHeaders).toHaveText(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    const gbHeaders = page.getByTestId('ws-gb-grid').locator('th')
    await expect(gbHeaders).toHaveText(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

    // April 2024 Monday-first has no leading padding (the 1st is a
    // Monday); Sunday-first leads with Sunday March 31.
    await expect(
      page.getByTestId('ws-us-grid').locator('button[data-date="2024-03-31"]')
    ).toHaveCount(0)
    await expect(
      page.getByTestId('ws-gb-grid').locator('button[data-date="2024-03-31"]')
    ).toHaveCount(1)

    // Home respects the override: Monday in the US grid, Sunday in GB.
    await page.getByTestId('ws-us-grid').locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Home')
    await expect(
      page.getByTestId('ws-us-grid').locator('button[data-date="2024-04-08"]')
    ).toBeFocused()
    await page.getByTestId('ws-gb-grid').locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Home')
    await expect(
      page.getByTestId('ws-gb-grid').locator('button[data-date="2024-04-07"]')
    ).toBeFocused()
  })
});
