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
  test('CA-RANGE-11: touch taps complete a range with no hover-only preview (synthetic tap path)', async ({
    mount,
    page,
  }) => {
    // The CT harness has no touch context, so taps are dispatched as
    // click events with no pointer movement — the tap path (activation
    // without hover) rather than a device gesture.
    await mount('components/Calendar/Calendar/RangeMachine')

    await page.dispatchEvent('button[data-date="2024-04-10"]', 'click')
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":null}'
    )
    // No hover preview exists between the taps.
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    await expect(page.locator('button[data-date][data-in-range]')).toHaveCount(0)

    await page.getByTestId('rmachine-accept').click()
    await page.dispatchEvent('button[data-date="2024-04-15"]', 'click')
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":null}|{"start":"2024-04-10","end":"2024-04-15"}'
    )
    // The roving target follows activation even without pointer focus.
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'tabindex',
      '0'
    )
    await page.getByTestId('rmachine-accept').click()
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(6)
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
  })
});
