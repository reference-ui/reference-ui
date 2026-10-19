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
  test('CA-LOC-07: runtime locale switch recomputes presentation without touching value or focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    await page.locator('button[data-date="2024-09-18"]').focus()
    // Synthetic toggle: a real click would move DOM focus to the button,
    // but the case asserts the grid-owned focus survives the switch.
    await page.getByTestId('gb-toggle-locale').dispatchEvent('click')

    // Sunday-first US presentation now.
    await expect(page.locator('th[scope="col"]').nth(0)).toHaveText('Sun')
    await expect(page.getByTestId('gb-heading')).toContainText('September 2024')
    // Value, focused ISO date, and both callback logs unchanged.
    await expect(page.getByTestId('gb-value')).toHaveText('2024-09-18')
    await expect(page.getByTestId('gb-changes')).toHaveText('none')
    await expect(page.getByTestId('gb-month-reqs')).toHaveText('none')
    await expect(page.locator('button[data-date="2024-09-18"]')).toHaveAttribute(
      'data-focused',
      ''
    )
    await expect(page.locator('button[data-date="2024-09-18"]')).toBeFocused()
  })
});
