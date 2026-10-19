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
  test('CA-RANGE-15: month navigation never completes a pending preview', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()
    await page.locator('button[data-date="2024-04-15"]').hover()

    const calendar = page.getByTestId('test-rmachine-calendar')
    await calendar.getByRole('button', { name: 'May 2024', exact: true }).click()
    await expect(page.getByTestId('rmachine-month-reqs')).toHaveText('2024-05')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    await page.getByTestId('rmachine-accept-month').click()
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(0)

    // Previous leg in the May pane: preview, navigate back, still pending.
    await page.locator('button[data-date="2024-05-10"]').hover()
    await calendar.getByRole('button', { name: 'April 2024', exact: true }).click()
    await expect(page.getByTestId('rmachine-month-reqs')).toHaveText('2024-04')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    await page.getByTestId('rmachine-accept-month').click()
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
  })
});
