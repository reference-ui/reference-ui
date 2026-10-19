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

  test('CA-DAY-03: a completed controlled range is inclusive with distinguished endpoints in render state', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-completed-13').click()

    const base = {
      outsideMonth: false,
      today: false,
      disabled: false,
      preview: false,
    }
    expect(await stateOf(page, '2024-04-09')).toEqual({
      date: '2024-04-09',
      formattedDay: '9',
      ...base,
      selected: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
    })
    expect(await stateOf(page, '2024-04-10')).toEqual({
      date: '2024-04-10',
      formattedDay: '10',
      ...base,
      selected: true,
      rangeStart: true,
      rangeEnd: false,
      inRange: true,
    })
    for (const d of ['2024-04-11', '2024-04-12']) {
      expect(await stateOf(page, d)).toEqual({
        date: d,
        formattedDay: String(Number(d.slice(8, 10))),
        ...base,
        selected: true,
        rangeStart: false,
        rangeEnd: false,
        inRange: true,
      })
    }
    expect(await stateOf(page, '2024-04-13')).toEqual({
      date: '2024-04-13',
      formattedDay: '13',
      ...base,
      selected: true,
      rangeStart: false,
      rangeEnd: true,
      inRange: true,
    })
    expect(await stateOf(page, '2024-04-14')).toEqual({
      date: '2024-04-14',
      formattedDay: '14',
      ...base,
      selected: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
    })
  })
});
