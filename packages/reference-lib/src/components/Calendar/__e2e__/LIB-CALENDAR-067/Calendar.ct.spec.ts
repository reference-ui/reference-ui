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
  test('CA-LOC-05: localized heading with target-month nav names and ISO callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await expect(page.getByTestId('out-heading')).toContainText('September 2024')
    await expect(page.getByTestId('out-prev')).toHaveAccessibleName('August 2024')
    await expect(page.getByTestId('out-next')).toHaveAccessibleName('October 2024')

    await page.getByTestId('out-next').click()
    await expect(page.getByTestId('out-month-reqs')).toHaveText('2024-10')
  })
});
