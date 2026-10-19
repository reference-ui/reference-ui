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

test.describe('Calendar day parts (FEATURES #5)', () => {
  const stateOf = (page: import('@playwright/test').Page, date: string) =>
    page.evaluate(
      (d) =>
        (window as unknown as { __dayStates: Record<string, unknown> }).__dayStates[d],
      date
    )

  test('CA-DAY-04: pending preview is public render state without touching controlled selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    await page.locator('button[data-date="2024-04-13"]').hover()
    expect(await stateOf(page, '2024-04-10')).toEqual({
      date: '2024-04-10',
      formattedDay: '10',
      outsideMonth: false,
      today: false,
      selected: true,
      disabled: false,
      rangeStart: true,
      rangeEnd: false,
      inRange: true,
      preview: true,
    })
    expect(await stateOf(page, '2024-04-11')).toEqual({
      date: '2024-04-11',
      formattedDay: '11',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: true,
      preview: true,
    })
    expect(await stateOf(page, '2024-04-13')).toEqual({
      date: '2024-04-13',
      formattedDay: '13',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: true,
      inRange: true,
      preview: true,
    })
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')

    // Hover clears; keyboard focus drives the next preview, and the prior
    // candidate returns every selection/range field to false.
    await page.getByTestId('range-after').hover()
    await page.locator('button[data-date="2024-04-12"]').focus()
    expect(await stateOf(page, '2024-04-12')).toEqual({
      date: '2024-04-12',
      formattedDay: '12',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: true,
      inRange: true,
      preview: true,
    })
    expect(await stateOf(page, '2024-04-13')).toEqual({
      date: '2024-04-13',
      formattedDay: '13',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    })
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
  })
});
