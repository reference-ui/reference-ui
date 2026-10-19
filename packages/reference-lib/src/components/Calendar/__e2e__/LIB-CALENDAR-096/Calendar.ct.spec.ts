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

  test('CA-DAY-02: the Day render state carries exactly ten fields for single, today, outside, and disabled dates', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayCustom')

    const expectedKeys = [
      'date',
      'formattedDay',
      'outsideMonth',
      'today',
      'selected',
      'disabled',
      'rangeStart',
      'rangeEnd',
      'inRange',
      'preview',
    ]
    // Every recorded state — not just the sampled dates — is exact.
    const violations = await page.evaluate((keys) => {
      const states = (window as unknown as { __dayStates: Record<string, object> }).__dayStates
      return Object.entries(states)
        .filter(([, s]) => JSON.stringify(Object.keys(s)) !== JSON.stringify(keys))
        .map(([d]) => d)
    }, expectedKeys)
    expect(violations).toEqual([])

    await expect
      .poll(async () => stateOf(page, '2024-04-10'))
      .toEqual({
        date: '2024-04-10',
        formattedDay: '10',
        outsideMonth: false,
        today: false,
        selected: true,
        disabled: false,
        rangeStart: false,
        rangeEnd: false,
        inRange: false,
        preview: false,
      })
    expect(await stateOf(page, '2024-04-11')).toEqual({
      date: '2024-04-11',
      formattedDay: '11',
      outsideMonth: false,
      today: true,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    })
    expect(await stateOf(page, '2024-04-12')).toEqual({
      date: '2024-04-12',
      formattedDay: '12',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: true,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    })
    expect(await stateOf(page, '2024-05-01')).toEqual({
      date: '2024-05-01',
      formattedDay: '1',
      outsideMonth: true,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    })
  })
});
