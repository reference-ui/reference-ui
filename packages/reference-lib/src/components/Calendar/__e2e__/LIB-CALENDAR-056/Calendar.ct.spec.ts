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
  test('CA-STATE-01/08: the today marker never follows selection or focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    const marker = page.locator('button[data-today]')
    await expect(marker).toHaveCount(1)
    await expect(marker).toHaveAttribute('data-date', '2024-09-10')
    await expect(marker).toHaveAttribute('aria-current', 'date')

    // Select and focus elsewhere: the marker stays put.
    await page.locator('button[data-date="2024-09-12"]').click()
    await page.locator('button[data-date="2024-09-20"]').focus()
    await expect(page.locator('button[data-today]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2024-09-10"]')).toHaveAttribute(
      'aria-current',
      'date'
    )
    await expect(page.locator('button[data-date="2024-09-12"]')).toHaveAttribute(
      'data-selected',
      ''
    )
  })
});
