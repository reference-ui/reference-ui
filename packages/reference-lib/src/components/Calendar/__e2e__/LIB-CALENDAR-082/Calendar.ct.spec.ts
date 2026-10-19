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
  test('CA-VIEW-08: Previous/Next are native-disabled and silent in month and year view', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    const prev = calendar.locator('[data-reference-calendar-header] > button').first()
    const next = calendar.locator('[data-reference-calendar-header] > button').last()

    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(prev).toBeDisabled()
    await expect(next).toBeDisabled()
    // Synthetic dispatch bypasses native suppression; the view guards
    // keep the request seams silent anyway.
    await prev.dispatchEvent('click')
    await next.dispatchEvent('click')
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('none')
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')

    await calendar.locator('[data-reference-calendar-year]').click()
    await expect(prev).toBeDisabled()
    await expect(next).toBeDisabled()
    await prev.dispatchEvent('click')
    await next.dispatchEvent('click')
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('none')

    // Back in day view the directions re-enable per target coverage.
    await calendar.locator('[data-reference-calendar-year]').click()
    await expect(prev).toBeEnabled()
    await expect(next).toBeEnabled()
  })
});
