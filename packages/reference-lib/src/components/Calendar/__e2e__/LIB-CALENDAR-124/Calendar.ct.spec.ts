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

test.describe('Calendar view defaulting + environments (VIEW-13, DAY-14, ENV)', () => {
  test('CA-DAY-14: custom Days keep one button identity and one event default under StrictMode on every React version', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/StrictDays')

    // Exactly one DOM Day per ISO date despite renderer replay.
    const dateCounts = await page.evaluate(() => {
      const dates = [...document.querySelectorAll('button[data-date]')].map((b) =>
        b.getAttribute('data-date')
      )
      return { total: dates.length, unique: new Set(dates).size }
    })
    expect(dateCounts.total).toBeGreaterThan(0)
    expect(dateCounts.total).toBe(dateCounts.unique)

    const refIsButton = () =>
      page.evaluate(() => {
        const w = window as unknown as { __strictRef?: Element | null }
        return w.__strictRef === document.querySelector('button[data-date="2024-04-10"]')
      })
    expect(await refIsButton()).toBe(true)

    // A no-op rerender keeps the exact node: no loop, no stale registration.
    await page.getByTestId('strict-bump').click()
    expect(await refIsButton()).toBe(true)

    // One activation: one consumer event, one controlled request.
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('strict-consumer')).toHaveText('1')
    await expect(page.getByTestId('strict-changes')).toHaveText('2024-04-10')
  })
});
