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
  test('CA-DYNAMIC-02/CA-STATE-06: newly unavailable keeps focus but goes silent; newly out-of-bounds relocates; selection preserved', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()

    // Synthetic toggles: the case changes constraints while focus is in
    // the grid, and a real click would move focus to the toggle first.
    await page.getByTestId('con-toggle-ten').dispatchEvent('click')
    // Unavailable stays focusable: focus and the tab stop stay on 04-10,
    // selection paint is preserved, activation goes silent.
    const selected = page.locator('button[data-date="2024-04-10"]')
    await expect(selected).toBeFocused()
    await expect(selected).toHaveAttribute('tabindex', '0')
    await expect(selected).toHaveAttribute('data-selected', '')
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    await expect(selected).toHaveAttribute('data-unavailable', '')
    await expect(selected).not.toHaveAttribute('data-disabled', '')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('con-changes')).toHaveText('2024-04-10')

    // Binding min to 04-15 pushes 04-10 out of bounds: focus relocates
    // forward-first to 04-15 — 04-11–14 are out of bounds too — while
    // selection paint is preserved.
    await page.getByTestId('con-toggle-bounds').dispatchEvent('click')
    await expect(page.locator('button[data-date="2024-04-15"]')).toBeFocused()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute('tabindex', '0')
    await expect(selected).toHaveAttribute('data-selected', '')
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    await expect(selected).toHaveAttribute('data-disabled', '')
    await expect(selected).toHaveAttribute('tabindex', '-1')
  })
});
