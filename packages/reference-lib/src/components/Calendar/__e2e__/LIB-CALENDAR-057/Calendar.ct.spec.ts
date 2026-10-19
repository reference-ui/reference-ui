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
  test('CA-STATE-02/CA-KEY-08: arrow focus moves the tab stop without rewriting selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    await page.getByTestId('gb-next').focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('button[data-date="2024-09-18"]')).toBeFocused()

    await page.keyboard.press('ArrowRight')
    const moved = page.locator('button[data-date="2024-09-19"]')
    await expect(moved).toBeFocused()
    await expect(moved).toHaveAttribute('tabindex', '0')
    await expect(moved).toHaveAttribute('data-focused', '')
    await expect(page.locator('button[data-date="2024-09-18"]')).toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.locator('button[data-date="2024-09-18"]')).toHaveAttribute(
      'tabindex',
      '-1'
    )
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('gb-changes')).toHaveText('none')
  })
});
