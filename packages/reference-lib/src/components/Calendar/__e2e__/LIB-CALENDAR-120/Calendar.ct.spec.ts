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

test.describe('Calendar range machine (FEATURES #9)', () => {
  test('CA-RANGE-14: Tab leaving the grid commits a valid pending preview without preventing Tab', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    // Valid path: the request fires on keydown, native focus settles on
    // the next control, and the range paints only after acceptance.
    await page.locator('button[data-date="2024-04-15"]').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-15"}'
    )
    // leg 1: the origin day carries
    // roving tabindex -1 (roving never followed the programmatic focus; the
    // 0-stop stays 2024-04-03). Chromium Tabs forward out of the grid;
    // WebKit restarts at the first explicit-tabindex stop. The commit
    // assertions are the product contract and hold on both.
    if (engineOf() === 'webkit') {
      await expect(page.locator('button[data-date="2024-04-03"]')).toBeFocused()
    } else {
      await expect(page.getByTestId('rmachine-null')).toBeFocused()
    }
    await expect(page.locator('button[data-date="2024-04-15"]')).not.toHaveAttribute(
      'aria-selected',
      'true'
    )
    await page.getByTestId('rmachine-accept').click()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'aria-selected',
      'true'
    )

    // Invalid path: a blocked span emits nothing while Tab still moves.
    await page.getByTestId('rmachine-pending-10').click()
    await page.getByTestId('rmachine-block12').click()
    await page.getByTestId('rmachine-clear').click()
    await page.locator('button[data-date="2024-04-15"]').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    // leg 2, same platform split as leg 1; verified the
    // 0-stop and landing stay 2024-04-03 across all three legs on WebKit).
    if (engineOf() === 'webkit') {
      await expect(page.locator('button[data-date="2024-04-03"]')).toBeFocused()
    } else {
      await expect(page.getByTestId('rmachine-null')).toBeFocused()
    }

    // Rejected path: blur clears the transient band, the start stays.
    await page.getByTestId('rmachine-block12').click()
    await page.locator('button[data-date="2024-04-15"]').focus()
    await page.keyboard.press('Tab')
    // leg 3: the rejected path needs grid blur to clear the transient
    // band; WebKit Tab stays in-grid (04-03 per the probe above), so move focus
    // out the way Chromium's Tab did — the blur-driven clear then runs
    // identically on both engines.
    if (engineOf() === 'webkit') await page.getByTestId('rmachine-null').focus()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-15"}'
    )
    await page.getByTestId('rmachine-reject').click()
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
  })
});
