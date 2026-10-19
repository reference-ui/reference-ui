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
  test('CA-VIEW-12: mode changes reset the private view to the home collection without stealing focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ModeSwitch')

    const calendar = page.getByTestId('test-mswitch-calendar')
    await expect(calendar).toHaveAttribute('data-mode', 'day')
    await expect(calendar).toHaveAttribute('data-view', 'day')

    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar).toHaveAttribute('data-view', 'month')

    // Focus stays outside on the mode button; the switch resets the view.
    await page.getByTestId('mswitch-month').focus()
    await page.getByTestId('mswitch-month').click()
    // WebKit click-focus never lands on buttons (mousedown
    // blurs to body), so re-deliver the Chromium focus state; the no-steal
    // assertion below then tests the mode switch on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('mswitch-month').focus()
    await expect(calendar).toHaveAttribute('data-mode', 'month')
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(calendar.locator('[data-reference-calendar-months]')).toBeVisible()
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)
    await expect(page.getByTestId('mswitch-month')).toBeFocused()
    await expect(page.getByTestId('mswitch-changes')).toHaveText('none')

    await page.getByTestId('mswitch-year').click()
    await expect(calendar).toHaveAttribute('data-mode', 'year')
    await expect(calendar).toHaveAttribute('data-view', 'year')
    await expect(calendar.locator('[data-reference-calendar-years]')).toBeVisible()
    await expect(calendar.locator('[data-reference-calendar-months]')).toHaveCount(0)

    await page.getByTestId('mswitch-range').click()
    await expect(calendar).toHaveAttribute('data-mode', 'range')
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(calendar.locator('[role="grid"]')).toBeVisible()

    await page.getByTestId('mswitch-day').click()
    await expect(calendar).toHaveAttribute('data-mode', 'day')
    await expect(calendar).toHaveAttribute('data-view', 'day')
  })
});
