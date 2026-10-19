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
  test('CA-RANGE-08: bounds and outside-month navigation apply to range preview and completion', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeBounds')

    // An out-of-bounds endpoint cannot preview.
    await page.locator('button[data-date="2024-10-04"]').hover({ force: true })
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)

    // An allowed endpoint previews inclusively.
    await page.locator('button[data-date="2024-09-30"]').hover()
    await expect(page.locator('button[data-date="2024-09-30"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(page.locator('button[data-date="2024-09-29"]')).toHaveAttribute(
      'data-in-range',
      ''
    )

    // Outside activation orders month before range, exactly once each.
    await page.locator('button[data-date="2024-10-01"]').click()
    await expect(page.getByTestId('rbounds-order')).toHaveText(
      'month:2024-10|change:2024-09-28:2024-10-01'
    )
    await page.getByTestId('rbounds-accept-month').click()
    await page.getByTestId('rbounds-accept').click()
    await expect(page.getByTestId('rbounds-value')).toHaveText('2024-09-28:2024-10-01')
    await expect(page.locator('button[data-date="2024-10-01"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
  })
});
