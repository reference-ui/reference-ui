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
  test('CA-RANGE-03: pointer leave clears transient preview without touching the pending range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.locator('button[data-date="2024-04-15"]').hover()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )

    await page.getByTestId('range-after').hover()
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    for (const d of ['2024-04-11', '2024-04-13', '2024-04-15']) {
      await expect(page.locator(`button[data-date="${d}"]`)).not.toHaveAttribute(
        'data-in-range',
        ''
      )
    }
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
  })
});
