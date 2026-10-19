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
  test('CA-RANGE-06: re-activating the pending start completes a one-day range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-10"}'
    )
    await page.getByTestId('rmachine-accept').click()
    const sole = page.locator('button[data-date="2024-04-10"]')
    await expect(sole).toHaveAttribute('data-range-start', '')
    await expect(sole).toHaveAttribute('data-range-end', '')
    await expect(sole).toHaveAttribute('data-in-range', '')
    await expect(sole).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2024-04-09"]')).not.toHaveAttribute(
      'data-in-range',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-11"]')).not.toHaveAttribute(
      'data-in-range',
      ''
    )

    // Keyboard leg: Enter on the pending start completes the same way.
    await page.getByTestId('rmachine-pending-10').click()
    await page.getByTestId('rmachine-clear').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-10"}'
    )
  })
});
