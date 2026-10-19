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

  test('CA-DAY-12: custom Day state and content refresh from latest props with stable node identity', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayCustom')

    await page.evaluate(() => {
      ;(window as unknown as { __april10?: Element | null }).__april10 =
        document.querySelector('button[data-date="2024-04-10"]')
    })
    // Locale, selection, and availability update together; the April 10
    // node survives with fresh state and managed attributes.
    await page.getByTestId('dcustom-locale').click()
    await page.getByTestId('dcustom-value-14').click()
    await page.getByTestId('dcustom-unavail').click()
    const sameNode = await page.evaluate(
      () =>
        document.querySelector('button[data-date="2024-04-10"]') ===
        (window as unknown as { __april10?: Element | null }).__april10
    )
    expect(sameNode).toBe(true)
    const day10Text = await page.locator('button[data-date="2024-04-10"]').innerText()
    expect(day10Text).not.toContain('10')
    expect(await stateOf(page, '2024-04-10')).toMatchObject({ selected: false })
    expect(await stateOf(page, '2024-04-14')).toMatchObject({
      selected: true,
      disabled: false,
    })
    expect(await stateOf(page, '2024-04-13')).toMatchObject({ disabled: true })
    expect(await stateOf(page, '2024-04-12')).toMatchObject({ disabled: false })
    await expect(page.locator('button[data-date="2024-04-14"]')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.locator('button[data-date="2024-04-13"]')).toHaveAttribute(
      'data-unavailable',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-12"]')).not.toHaveAttribute(
      'data-unavailable',
      ''
    )

    // The controlled month swaps the grid: May invokes only current
    // dates/data, the new event map applies, and the removed ref cleans up.
    await page.evaluate(() => {
      ;(window as unknown as { __dayStates: Record<string, unknown> }).__dayStates = {}
    })
    await page.getByTestId('dcustom-month').click()
    await page.getByTestId('dcustom-events').click()
    await expect(page.locator('button[data-date="2024-05-15"]')).toBeVisible()
    const recorded = await page.evaluate(
      () => Object.keys((window as unknown as { __dayStates: Record<string, unknown> }).__dayStates)
    )
    expect(recorded).toContain('2024-05-15')
    expect(recorded).not.toContain('2024-04-10')
    expect(recorded).not.toContain('2024-04-14')
    await expect(page.locator('[data-testid^="dcustom-dot-"]')).toHaveCount(0)
    const refLog = await page.evaluate(
      () => (window as unknown as { __refLog: string[] }).__refLog
    )
    expect(refLog[refLog.length - 1]).toBe('null')
  })
});
