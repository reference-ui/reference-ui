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

test.describe('Calendar CT', () => {
  test('renders leap February with Thursday-aligned start (kernel grid)', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/LeapFebruary')

    await expect(page.getByTestId('leap-heading')).toContainText('February 2024')
    // 29 in-month days + 4 leading (Jan 28–31) + 2 trailing (Mar 1–2) padded buttons.
    await expect(page.locator('button[data-date]')).toHaveCount(35)
    await expect(page.locator('button[data-date="2024-02-01"]')).toBeVisible()
    await expect(page.locator('button[data-date="2024-02-29"]')).toBeVisible()

    // Feb 1 2024 was a Thursday: 4 padded January buttons precede it in the Sunday-first grid.
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow.locator('td')).toHaveCount(7)
    await expect(firstRow.locator('td').nth(0).locator('button')).toHaveAttribute(
      'data-date',
      '2024-01-28'
    )
    await expect(firstRow.locator('td').nth(0).locator('button')).toHaveAttribute(
      'data-outside-month',
      ''
    )
    await expect(firstRow.locator('td').nth(4).locator('button')).toHaveAttribute(
      'data-date',
      '2024-02-01'
    )
    await expect(firstRow.locator('td').nth(4).locator('button')).not.toHaveAttribute(
      'data-outside-month',
      ''
    )
  })
});
