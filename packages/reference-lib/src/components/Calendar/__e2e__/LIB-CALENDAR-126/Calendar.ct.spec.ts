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

test.describe('Calendar view defaulting + environments (VIEW-13, DAY-14, ENV)', () => {
  test('CA-ENV-04: public date behavior is identical across engines (chromium proof; others unrun)', async ({
    mount,
    page,
  }) => {
    // Honest scope: the CT harness runs Desktop Chrome only — there is no
    // Firefox/WebKit project — so this pins the cross-engine vectors on
    // chromium. Identical Firefox/WebKit behavior is NOT proven here.

    // en-GB grid shape + full date names.
    await mount('components/Calendar/Calendar/BritishGrid')
    await expect(page.getByTestId('gb-grid').locator('th').first()).toHaveText('Mon')
    const gbName = await page
      .locator('button[data-date="2024-09-18"]')
      .getAttribute('aria-label')
    expect(gbName).toContain('September')

    // Bounded arrow movement stops without wrapping.
    await mount('components/Calendar/Calendar/Constrained')
    await page.locator('button[data-date="2024-04-05"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('button[data-date="2024-04-05"]')).toBeFocused()

    // Outside-month callback ordering.
    await mount('components/Calendar/Calendar/OutsideMonth')
    await page.locator('button[data-date="2024-10-01"]').click()
    await expect(page.getByTestId('out-events')).toHaveText('m:2024-10,c:2024-10-01')

    // Single activation emits its canonical ISO once.
    await mount('components/Calendar/Calendar/EmissionCounter')
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('emit-log')).toHaveText('2024-04-10')

    // Pending/completed range with an unavailable crossing rejected.
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()
    await page.getByTestId('rmachine-block12').click()
    await page.locator('button[data-date="2024-04-15"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    await page.getByTestId('rmachine-block12').click()
    await page.locator('button[data-date="2024-04-15"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-15"}'
    )

    // Live month update announces through the stable Heading.
    await mount('components/Calendar/Calendar/MonthMachine')
    await page.getByTestId('month-next').click()
    await page.getByTestId('month-accept').click()
    await expect(page.getByTestId('month-heading')).toHaveText('February 2024')
  })
});
