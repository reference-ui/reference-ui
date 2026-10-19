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
  test('CA-RANGE-01: the first enabled activation requests a controlled pending range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":null}'
    )
    // No optimistic selection before acceptance.
    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(0)

    await page.getByTestId('rmachine-accept').click()
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
  })
});
