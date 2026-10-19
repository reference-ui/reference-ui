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

test.describe('Calendar custom days + week start', () => {
  test('Day renders custom content, null keeps the default, selection/disabled/keyboard compose', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/CustomDayCells')

    // Custom content on plain, unavailable, and out-of-bounds days alike.
    await expect(page.getByTestId('day-dot-2024-04-08')).toHaveText('●●')
    await expect(page.getByTestId('day-dot-2024-04-12')).toHaveText('●')
    await expect(page.getByTestId('day-dot-2024-04-02')).toHaveText('●')
    // Null return keeps the default locale number.
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveText('15')

    // Selection composes: the dotted day selects with full selected paint.
    await page.locator('button[data-date="2024-04-08"]').click()
    await expect(page.getByTestId('custom-changes')).toHaveText('2024-04-08')
    await expect(page.getByTestId('custom-value')).toHaveText('2024-04-08')
    const dotted = page.locator('button[data-date="2024-04-08"]')
    await expect(dotted).toHaveAttribute('aria-selected', 'true')
    await expect(dotted).toHaveAttribute('data-selected', '')

    // Disabled and unavailable custom days render dots but stay silent
    // (force bypasses the disabled/aria-disabled actionability gates).
    await page.locator('button[data-date="2024-04-02"]').click({ force: true })
    await page.locator('button[data-date="2024-04-12"]').click({ force: true })
    await expect(page.getByTestId('custom-changes')).toHaveText('2024-04-08')

    // Keyboard traverses custom cells; Enter on the unavailable one is silent.
    await page.locator('button[data-date="2024-04-08"]').focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-12"]')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('custom-changes')).toHaveText('2024-04-08')
  })
});
