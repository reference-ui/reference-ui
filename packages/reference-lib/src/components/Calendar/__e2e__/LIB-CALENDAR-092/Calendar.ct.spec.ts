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
  test('CA-MODE-05: a fully unavailable month or year is disabled and silent; partial units stay enabled', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/MonthMode')

    const calendar = page.getByTestId('test-mmonth-calendar')
    await expect(calendar.locator('button[data-month="2024-06"]')).toBeEnabled()

    await page.getByTestId('mmonth-block-june').dispatchEvent('click')
    const june = calendar.locator('button[data-month="2024-06"]')
    await expect(june).toBeDisabled()
    await june.click({ force: true })
    await expect(page.getByTestId('mmonth-changes')).toHaveText('none')
    await expect(calendar.locator('button[data-month="2024-07"]')).toBeEnabled()

    await mount('components/Calendar/Calendar/YearMode')
    const years = page.getByTestId('test-ymode-calendar')
    await expect(years.locator('button[data-year="2025"]')).toBeEnabled()
    await page.getByTestId('ymode-block-2025').dispatchEvent('click')
    const y2025 = years.locator('button[data-year="2025"]')
    await expect(y2025).toBeDisabled()
    await y2025.click({ force: true })
    await expect(page.getByTestId('ymode-changes')).toHaveText('none')
    await expect(years.locator('button[data-year="2024"]')).toBeEnabled()
  })
});
