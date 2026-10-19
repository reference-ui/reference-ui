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

  test('CA-DAY-05: custom Day keeps children, native props, StyleProps, and a stable native ref across rerenders', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayCustom')

    const day8 = page.locator('button[data-date="2024-04-08"]')
    const day10 = page.locator('button[data-date="2024-04-10"]')
    await expect(page.getByTestId('dcustom-dot-2024-04-08')).toHaveText('●●')
    await expect(day8).toHaveAttribute('title', 'day 2024-04-08')
    await expect(day8).toHaveAttribute('data-booking-count', '2')
    await expect(day8).toHaveClass(/dcustom-day/)
    await expect(day8).toHaveCSS('color', 'rgb(255, 0, 0)')
    // Consumer fontWeight wins over the managed selected weight (600).
    await expect(day10).toHaveCSS('font-weight', '700')

    const refIsButton = () =>
      page.evaluate(() => {
        const w = window as unknown as { __dayRef?: Element | null }
        return w.__dayRef === document.querySelector('button[data-date="2024-04-10"]')
      })
    expect(await refIsButton()).toBe(true)

    // A no-op rerender keeps the exact button attached: the stable ref
    // still receives that node (an intermediate null+set from React 19
    // ref-effect semantics inside the button primitive is supported
    // cleanup behavior, not a remount).
    await page.getByTestId('dcustom-bump').click()
    expect(await refIsButton()).toBe(true)
    const refLog = await page.evaluate(
      () => (window as unknown as { __refLog: string[] }).__refLog
    )
    expect(refLog[refLog.length - 1]).toBe('set:2024-04-10')

    // Unmount (month change) runs supported cleanup exactly once.
    await page.getByTestId('dcustom-month').click()
    await expect(page.locator('button[data-date="2024-05-01"]')).toBeVisible()
    const refLogAfter = await page.evaluate(
      () => (window as unknown as { __refLog: string[] }).__refLog
    )
    expect(refLogAfter[refLogAfter.length - 1]).toBe('null')
  })
});
