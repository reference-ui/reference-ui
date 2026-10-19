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

test.describe('Calendar day parts (FEATURES #5)', () => {
  const stateOf = (page: import('@playwright/test').Page, date: string) =>
    page.evaluate(
      (d) =>
        (window as unknown as { __dayStates: Record<string, unknown> }).__dayStates[d],
      date
    )

  test('CA-DAY-01: default Days render each locale day number with exactly one button per gridcell', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayPartsDefault')

    const grid = page.getByTestId('ddef-grid')
    await expect(grid.locator('button[data-date="2024-04-10"]')).toHaveText('10')
    await expect(grid.locator('button[data-date="2024-05-01"]')).toHaveText('1')
    // April 2024 Monday-first: 30 in-month + 5 trailing, all in-domain.
    await expect(grid.locator('tbody td')).toHaveCount(35)
    await expect(grid.locator('tbody td button')).toHaveCount(35)
    // The visible number is not the accessible name: no duplicated text.
    const name = await grid
      .locator('button[data-date="2024-04-10"]')
      .getAttribute('aria-label')
    expect(name).not.toBe('10')
    expect(name).toContain('April')
  })
});
