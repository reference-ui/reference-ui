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
  test('CA-LOC-04/CA-GRID-05/CA-GRID-06: en-GB Monday-first headers, outside padding, full date names', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    const headers = page.locator('th[scope="col"]')
    await expect(headers).toHaveCount(7)
    await expect(headers.nth(0)).toHaveText('Mon')
    await expect(headers.nth(6)).toHaveText('Sun')
    await expect(headers.nth(0)).toHaveAccessibleName('Monday')

    // September 2024 Monday-first: Aug 26–31 lead, Oct 1–6 trail.
    await expect(page.locator('button[data-outside-month]')).toHaveCount(12)
    await expect(page.locator('button[data-date="2024-08-26"]')).toHaveAttribute(
      'data-outside-month',
      ''
    )
    await expect(page.locator('button[data-date="2024-09-01"]')).not.toHaveAttribute(
      'data-outside-month',
      ''
    )

    // Same visible number, unambiguous accessible names.
    await expect(page.locator('button[data-date="2024-10-01"]')).toHaveText('1')
    await expect(page.locator('button[data-date="2024-10-01"]')).toHaveAccessibleName(
      /Tuesday.*1.*October.*2024/
    )
    await expect(page.locator('button[data-date="2024-09-01"]')).toHaveAccessibleName(
      /Sunday.*1.*September.*2024/
    )
  })
});
