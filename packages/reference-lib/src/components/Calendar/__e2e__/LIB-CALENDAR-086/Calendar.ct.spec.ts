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

test.describe('Calendar month/year views (FEATURES #10)', () => {
  test('CA-VIEW-11: view and month announce through one live Heading without a global announcer', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BareHeadingViews')

    const calendar = page.getByTestId('test-bare-calendar')
    const heading = page.getByTestId('bare-heading')
    await expect(heading).toHaveAttribute('aria-live', 'polite')
    await expect(heading).toHaveAttribute('aria-atomic', 'true')
    await expect(heading).toHaveText('April 2024')

    // Entering month view mutates the Heading to the year exactly once.
    await page.evaluate(() => {
      const node = document.querySelector('[data-testid="bare-heading"]')!
      ;(window as unknown as { __headingMutations: number }).__headingMutations = 0
      new MutationObserver((records) => {
        const w = window as unknown as { __headingMutations: number }
        for (const record of records) {
          if (record.type === 'characterData') w.__headingMutations += 1
          for (const added of record.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE) w.__headingMutations += 1
          }
        }
      }).observe(node, { characterData: true, childList: true, subtree: true })
    })
    await page.getByTestId('bare-month').click()
    await expect(heading).toHaveText('2024')
    expect(
      await page.evaluate(
        () => (window as unknown as { __headingMutations: number }).__headingMutations
      )
    ).toBe(1)

    // Activating June and accepting the month announces June 2024 once.
    await page.evaluate(() => {
      ;(window as unknown as { __headingMutations: number }).__headingMutations = 0
    })
    await calendar.locator('button[data-month="2024-06"]').click()
    await page.getByTestId('bare-accept').click()
    await expect(heading).toHaveText('June 2024')
    expect(
      await page.evaluate(
        () => (window as unknown as { __headingMutations: number }).__headingMutations
      )
    ).toBe(1)

    // The day Grid still names itself from the Heading; Month/Year keep
    // their locale names.
    const headingId = await heading.getAttribute('id')
    await expect(page.getByTestId('bare-grid')).toHaveAttribute('aria-labelledby', headingId!)
    await expect(page.getByTestId('bare-month')).toHaveAccessibleName('June')
    await expect(page.getByTestId('bare-year')).toHaveAccessibleName('2024')
  })
});
