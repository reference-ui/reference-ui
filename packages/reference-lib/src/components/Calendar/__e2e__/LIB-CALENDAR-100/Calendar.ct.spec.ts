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

  test('CA-DAY-06: managed Day semantics stay authoritative over conflicting consumer props', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayCustom')
    await page.getByTestId('dcustom-conflict').click()

    const day10 = page.locator('button[data-date="2024-04-10"]')
    const day11 = page.locator('button[data-date="2024-04-11"]')
    const day12 = page.locator('button[data-date="2024-04-12"]')
    const day2 = page.locator('button[data-date="2024-04-02"]')

    // Selected day: managed label, selection, enabled state, sole tab stop.
    const conflictLabel = await day10.getAttribute('aria-label')
    expect(conflictLabel).not.toBe('forged label')
    await expect(day10).toHaveAttribute('aria-selected', 'true')
    await expect(day10).toBeEnabled()
    await expect(day10).not.toHaveAttribute('aria-disabled', 'true')
    await expect(day10).toHaveAttribute('tabindex', '0')
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
    await expect(day10).toHaveAttribute('data-selected', '')
    await expect(day10).not.toHaveAttribute('data-today', '')
    // The generated td alone exposes the managed cell selection.
    await expect(day10.locator('xpath=ancestor::td[1]')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(day11.locator('xpath=ancestor::td[1]')).toHaveAttribute(
      'aria-selected',
      'false'
    )
    // Unrelated decoration survives.
    await expect(day10).toHaveAttribute('aria-describedby', 'dcustom-desc')

    // Today, unavailable, out-of-bounds, and outside-month keep managed state.
    await expect(day11).toHaveAttribute('data-today', '')
    await expect(day12).toHaveAttribute('aria-disabled', 'true')
    await expect(day12).toHaveAttribute('data-unavailable', '')
    // Unavailable stays natively enabled: no native disabled
    // attribute despite the conflicting consumer prop. (Playwright's
    // toBeEnabled counts aria-disabled, so the native attribute is
    // asserted directly.)
    await expect(day12).not.toHaveAttribute('disabled', '')
    await expect(day2).toBeDisabled()
    await expect(day2).toHaveAttribute('data-disabled', '')
    await expect(page.locator('button[data-date="2024-05-01"]')).toHaveAttribute(
      'data-outside-month',
      ''
    )
    await expect(day10).not.toHaveAttribute('data-outside-month', '')

    // Forged range attributes never appear in single mode.
    await expect(page.locator('button[data-date][data-range-start]')).toHaveCount(0)
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    await expect(page.locator('button[data-date][data-in-range]')).toHaveCount(0)

    // The managed label equals the default-path full date name.
    await page.getByTestId('dcustom-plain').click()
    await expect(day10).toHaveAttribute('aria-label', conflictLabel!)
  })
});
