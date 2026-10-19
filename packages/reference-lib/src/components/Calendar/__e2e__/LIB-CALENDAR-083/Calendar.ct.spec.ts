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
  test('CA-VIEW-08: a completed range survives a view round-trip with no invented completion', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeViews')

    const calendar = page.getByTestId('test-rviews-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()
    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    // The completed interval still paints on rendered in-pane days, and no
    // completion was invented: the endpoints live outside the April pane,
    // so in-range paint plus callback silence is the round-trip proof.
    await expect(calendar.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-in-range',
      ''
    )
    await expect(calendar.locator('button[data-date="2024-04-15"]')).not.toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.getByTestId('rviews-changes')).toHaveText('none')
  })
});
