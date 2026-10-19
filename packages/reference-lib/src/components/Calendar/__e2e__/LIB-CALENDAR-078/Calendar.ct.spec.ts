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
  test('CA-VIEW-04: Months renders twelve locale cells with whole-month min/max disabling', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/FoldedViews')

    const calendar = page.getByTestId('test-views-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()

    const cells = calendar.locator('button[data-reference-calendar-month-cell]')
    await expect(cells).toHaveCount(12)
    await expect(calendar.locator('button[data-month="2024-01"]')).toHaveText('Jan')
    await expect(calendar.locator('button[data-month="2024-12"]')).toHaveText('Dec')

    // Partial months stay enabled; whole months outside stay disabled.
    await expect(calendar.locator('button[data-month="2024-03"]')).toBeEnabled()
    await expect(calendar.locator('button[data-month="2024-10"]')).toBeEnabled()
    for (const whole of ['2024-01', '2024-02', '2024-11', '2024-12']) {
      const cell = calendar.locator(`button[data-month="${whole}"]`)
      await expect(cell).toBeDisabled()
      await expect(cell).toHaveAttribute('aria-disabled', 'true')
    }
    await expect(calendar.locator('button[data-month="2024-04"]')).toHaveAttribute(
      'data-current',
      ''
    )
    // The day table stands down: hidden, out of the accessibility tree.
    await expect(calendar.locator('[role="grid"]')).toBeHidden()
  })
});
