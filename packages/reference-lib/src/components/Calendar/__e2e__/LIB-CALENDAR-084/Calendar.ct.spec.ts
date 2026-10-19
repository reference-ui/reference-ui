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
  test('CA-VIEW-09: month and year cells paint range start, end, and in-range without preview', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeViews')

    const calendar = page.getByTestId('test-rviews-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()

    const march = calendar.locator('button[data-month="2024-03"]')
    const april = calendar.locator('button[data-month="2024-04"]')
    const may = calendar.locator('button[data-month="2024-05"]')
    const june = calendar.locator('button[data-month="2024-06"]')
    await expect(march).toHaveAttribute('data-range-start', '')
    await expect(june).toHaveAttribute('data-range-end', '')
    await expect(april).toHaveAttribute('data-in-range', '')
    await expect(may).toHaveAttribute('data-in-range', '')
    await expect(april).toHaveAttribute('data-selected', '')

    // Hovering a month cell invents no preview attributes.
    const before = await april.getAttribute('data-in-range')
    await june.hover()
    await expect(april).toHaveAttribute('data-in-range', before ?? '')
    await expect(page.getByTestId('rviews-changes')).toHaveText('none')

    // Year view of a 2023–2025 range marks those years the same way.
    await page.getByTestId('rviews-3yr').click()
    await calendar.locator('[data-reference-calendar-year]').click()
    await expect(calendar.locator('button[data-year="2023"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(calendar.locator('button[data-year="2025"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(calendar.locator('button[data-year="2024"]')).toHaveAttribute(
      'data-in-range',
      ''
    )
  })
});
