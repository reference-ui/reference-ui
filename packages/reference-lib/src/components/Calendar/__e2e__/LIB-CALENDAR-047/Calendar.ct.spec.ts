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
  test('CA-STATE-03: selection-less pane tabs into today without stealing focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DecemberNav')

    const targets = page.locator('button[data-date][tabindex="0"]')
    await expect(targets).toHaveCount(1)
    await expect(targets).toHaveAttribute('data-date', '2026-12-15')
    // No automatic focus steal on mount.
    await expect(page.locator('button[data-date="2026-12-15"]')).not.toBeFocused()

    // Native Tab from the last header control enters the grid at today.
    await page.getByTestId('dec-next').focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('button[data-date="2026-12-15"]')).toBeFocused()
  })
});
