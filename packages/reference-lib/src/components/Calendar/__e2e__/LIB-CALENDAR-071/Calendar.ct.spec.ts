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
  test('CA-STATE-07: an all-unavailable grid keeps its sole tab stop but selects nothing', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.getByTestId('con-toggle-all').click()
    const targets = page.locator('button[data-date][tabindex="0"]')
    await expect(targets).toHaveCount(1)
    await expect(targets).toHaveAttribute('data-date', '2024-04-05')

    // Out-of-bounds paint wins where both apply; nav stays disabled —
    // no target-month date is selectable.
    await expect(page.locator('button[data-date="2024-04-04"]')).toHaveAttribute('data-disabled', '')
    await expect(page.locator('button[data-date="2024-04-04"]')).not.toHaveAttribute(
      'data-unavailable',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-unavailable',
      ''
    )
    await expect(page.getByTestId('con-prev')).toBeDisabled()
    await expect(page.getByTestId('con-next')).toBeDisabled()

    // Pointer and keyboard activation are silent everywhere (force
    // bypasses the aria-disabled actionability gate; the click is trusted).
    await page.locator('button[data-date="2024-04-10"]').click({ force: true })
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('con-changes')).toHaveText('none')
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')

    // The grid tab stop is reachable in native order: Shift+Tab from the
    // first fixture button lands on it (nav is disabled, so nothing sits
    // between the grid and the fixture buttons).
    await page.getByTestId('con-toggle-ten').focus()
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('button[data-date="2024-04-05"]')).toBeFocused()
  })
});
