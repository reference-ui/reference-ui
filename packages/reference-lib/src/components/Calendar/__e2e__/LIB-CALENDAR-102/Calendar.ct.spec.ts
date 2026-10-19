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

  test('CA-DAY-08: a Day whose date mismatches its render state diagnoses and renders non-interactive', async ({
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

    await expect
      .poll(() => errors.filter((e) => e.includes('2024-04-10') && e.includes('2024-04-11')))
      .toHaveLength(1)
    expect(errors[0]).toContain('must exactly match')
    // No duplicate or misbound interactive cell: the 04-10 td has no
    // button while the real 04-11 keeps exactly one.
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(0)
    await expect(page.locator('button[data-date="2024-04-11"]')).toHaveCount(1)
    await expect(page.getByTestId('dviol-changes')).toHaveText('none')
    await expect(page.getByTestId('dviol-month-reqs')).toHaveText('none')

    // A noncanonical date mismatches the same way and never reaches the
    // availability predicate.
    await page.getByTestId('dviol-noncanonical').click()
    await expect
      .poll(() => errors.filter((e) => e.includes('2024-4-1')))
      .toHaveLength(1)
    const unavailCalls = await page.evaluate(
      () => (window as unknown as { __unavailCalls: string[] }).__unavailCalls
    )
    expect(unavailCalls).not.toContain('2024-4-1')
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(0)

    // Recovery: the valid renderer mounts the cell with no new diagnostic.
    const before = errors.length
    await page.getByTestId('dviol-valid').click()
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(1)
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('dviol-changes')).toHaveText('2024-04-10')
    expect(errors.length).toBe(before)
  })
});
