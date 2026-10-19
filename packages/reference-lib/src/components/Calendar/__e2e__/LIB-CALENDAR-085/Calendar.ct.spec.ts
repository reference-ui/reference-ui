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
  test('CA-VIEW-10: month and year grids move focus in a three-column field without selecting', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()

    // One tab stop in the month collection, on current April.
    await expect(calendar.locator('button[data-month][tabindex="0"]')).toHaveCount(1)
    await expect(calendar.locator('button[data-month][tabindex="0"]')).toHaveAttribute(
      'data-month',
      '2024-04'
    )

    // Each arrow from April: Right→May, Left→March, Down→July, Up→January.
    await calendar.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(calendar.locator('button[data-month="2024-05"]')).toBeFocused()
    await calendar.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(calendar.locator('button[data-month="2024-03"]')).toBeFocused()
    await calendar.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowDown')
    await expect(calendar.locator('button[data-month="2024-07"]')).toBeFocused()
    await calendar.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowUp')
    await expect(calendar.locator('button[data-month="2024-01"]')).toBeFocused()
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')

    // Enter on June navigates (CA-VIEW-05), never selects.
    await calendar.locator('button[data-month="2024-06"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('2024-06')
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')

    // Shorter vector on Years.
    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2024"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(calendar.locator('button[data-year="2025"]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(calendar.locator('button[data-year="2028"]')).toBeFocused()

    // Inherited RTL reverses only the horizontal arrows.
    await mount('components/Calendar/Calendar/RtlGrid')
    const rtl = page.getByTestId('test-rtl-calendar')
    await page.getByTestId('rtl-month').click()
    await rtl.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(rtl.locator('button[data-month="2024-05"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(rtl.locator('button[data-month="2024-04"]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(rtl.locator('button[data-month="2024-07"]')).toBeFocused()
  })
});
