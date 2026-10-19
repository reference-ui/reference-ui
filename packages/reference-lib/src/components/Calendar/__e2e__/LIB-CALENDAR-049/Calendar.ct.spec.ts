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
  test('CA-SINGLE-01/02/03/05: activation requests its ISO once per gesture; re-activating the selected date is silent; rejection leaves selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/EmissionCounter')

    const log = page.getByTestId('emit-log')
    const day10 = page.locator('button[data-date="2024-04-10"]')
    const day12 = page.locator('button[data-date="2024-04-12"]')

    await expect(log).toHaveText('none')

    await day10.click()
    await expect(log).toHaveText('2024-04-10')
    await expect(day10).toHaveAttribute('data-selected', '')

    // Enter and Space each request the focused unselected date exactly
    // once (native button timing, no synthetic double-fire).
    await day12.focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('2024-04-10,2024-04-12')
    await expect(day12).toHaveAttribute('data-selected', '')
    await page.getByTestId('emit-toggle-accept').click() // reject: value stays 12th
    await day10.focus()
    await page.keyboard.press('Space')
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10')
    await expect(day12).toHaveAttribute('data-selected', '')
    await page.getByTestId('emit-toggle-accept').click() // accept again

    // Re-activating the already-selected date emits nothing — no request,
    // no null, not a toggle (the identical-value guard restores CA-SINGLE-03's no-emit read).
    await day12.click()
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10')
    await day12.focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10')
    await page.keyboard.press('Space')
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10')
    await expect(day12).toHaveAttribute('data-selected', '')

    // Parent rejection: the request logs but selection stays put.
    await page.getByTestId('emit-toggle-accept').click()
    await day10.click()
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10,2024-04-10')
    await expect(day12).toHaveAttribute('data-selected', '')
    await expect(day10).not.toHaveAttribute('data-selected', '')
  })
});
