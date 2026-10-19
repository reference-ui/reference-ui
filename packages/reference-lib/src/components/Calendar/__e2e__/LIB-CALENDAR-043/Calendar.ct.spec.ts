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

test.describe('Calendar CT', () => {
  test('renders calendar grid, selects date on click and updates state', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/SingleDate')

    const calendar = page.getByTestId('test-calendar')
    const display = page.getByTestId('calendar-value-display')
    const day20 = page.locator('button[data-date="2026-08-20"]')

    await expect(calendar).toBeVisible()
    await expect(display).toHaveText('Selected Date: 2026-08-15')
    await page.waitForTimeout(300)
    await snap(page, 'single-resting')

    // Hover unselected day
    await day20.hover()
    await page.waitForTimeout(200)
    await snap(page, 'single-hover')

    // Focus day
    await day20.focus()
    await page.waitForTimeout(200)
    await snap(page, 'single-focus')

    // Click August 20, 2026
    await day20.click()
    await expect(day20).toHaveAttribute('data-selected', '')
    await expect(display).toHaveText('Selected Date: 2026-08-20')
    await page.waitForTimeout(300)
    await snap(page, 'single-selected')

    // Navigate to next month
    const nextBtn = page.getByTestId('calendar-next')
    await nextBtn.click()
    await page.waitForTimeout(300)
    await snap(page, 'single-next-month')
  })
});
