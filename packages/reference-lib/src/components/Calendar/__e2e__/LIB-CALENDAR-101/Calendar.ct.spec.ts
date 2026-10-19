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

  test('CA-DAY-07/CA-KEY-09: consumer Day events run first and preventDefault cancels navigation and selection (chromium)', async ({
    mount,
    page,
  }) => {
    // CA-DAY-07 is tagged [browser:all]; the CT harness runs Desktop
    // Chrome only, so Firefox/WebKit coverage is NOT proven here (same
    // honest scope as CA-ENV-04 below).
    await mount('components/Calendar/Calendar/DayCustom')
    const log = page.getByTestId('dcustom-log')

    // Uncanceled pointer order: Day.onClick → onChange(date).
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(log).toHaveText('click:2024-04-10,change:2024-04-10')

    // Enter order: Day.onKeyDown → Day.onClick → onChange(date).
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('key:2024-04-10:Enter,click:2024-04-10,change:2024-04-10')

    // Space follows native button keyup timing with one request.
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Space')
    await expect(log).toHaveText('key:2024-04-10: ,click:2024-04-10,change:2024-04-10')

    // Arrow order: Day.onKeyDown → focus(nextDate), no selection.
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(log).toHaveText('key:2024-04-10:ArrowRight')
    await expect(page.locator('button[data-date="2024-04-11"]')).toBeFocused()

    // Cancellation in onClick suppresses selection; value stays empty.
    await page.getByTestId('dcustom-veto-click').click()
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(log).toHaveText('click:2024-04-10')
    await expect(page.getByTestId('dcustom-value')).toHaveText('None')
    await page.getByTestId('dcustom-veto-click').click()

    // Cancellation in onKeyDown suppresses movement and activation.
    await page.getByTestId('dcustom-veto-key').click()
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()
    await page.keyboard.press('PageDown')
    await expect(log).toHaveText('key:2024-04-10:ArrowRight,key:2024-04-10:PageDown')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await expect(page.getByTestId('dcustom-value')).toHaveText('None')
    await expect(page.getByTestId('dcustom-month')).toHaveText('2024-04')

    // Uncanceled control: the same gestures act once the veto lifts.
    await page.getByTestId('dcustom-veto-key').click()
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-11"]')).toBeFocused()
  })
});
