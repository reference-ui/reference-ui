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

  test('CA-DAY-11: a renderer returning a foreign element diagnoses without cloning managed props', async ({
    mount,
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('[reference-ui] Calendar:')) {
        errors.push(msg.text())
      }
    })
    await mount('components/Calendar/Calendar/DayViolations')

    await page.getByTestId('dviol-native').click()
    await expect
      .poll(() =>
        errors.filter((e) => e.includes('2024-04-10') && e.includes('native <button>'))
      )
      .toHaveLength(1)

    await page.getByTestId('dviol-wrapped').click()
    await expect
      .poll(() =>
        errors.filter((e) => e.includes('2024-04-10') && e.includes('native <span>'))
      )
      .toHaveLength(1)

    await page.getByTestId('dviol-component').click()
    await expect
      .poll(() =>
        errors.filter((e) => e.includes('2024-04-10') && e.includes('<ForeignDay>'))
      )
      .toHaveLength(1)

    // No substitute entered the grid: no foreign button, no managed
    // props cloned, no listeners or refs leaked, no callbacks.
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(0)
    await expect(page.locator('[data-foreign-day]')).toHaveCount(0)
    await expect(page.getByTestId('dviol-changes')).toHaveText('none')
    await expect(page.getByTestId('dviol-month-reqs')).toHaveText('none')
  })
});
