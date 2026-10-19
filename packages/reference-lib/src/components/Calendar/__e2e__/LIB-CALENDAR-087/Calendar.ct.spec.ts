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
  test('CA-VIEW-11: the folded Heading keeps its live region across view toggles', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    const heading = calendar.locator('[data-reference-calendar-heading]')
    await expect(heading).toHaveAttribute('aria-live', 'polite')
    await expect(heading).toHaveAttribute('aria-atomic', 'true')

    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(heading).toHaveAttribute('aria-live', 'polite')
    await expect(calendar.locator('[data-reference-calendar-month]')).toHaveAccessibleName(
      'April'
    )
    await expect(calendar.locator('[data-reference-calendar-year]')).toHaveAccessibleName(
      '2024'
    )
    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar.locator('[role="grid"]')).toBeVisible()
  })
});
