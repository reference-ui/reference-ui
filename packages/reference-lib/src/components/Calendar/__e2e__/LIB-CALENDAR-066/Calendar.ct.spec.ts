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
  test('CA-MONTH-06/CA-GRID-12: an accepted month produces exactly one heading mutation', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await page.getByTestId('out-next').click()
    await page.evaluate(() => {
      const heading = document.querySelector('[data-testid="out-heading"]')!
      ;(window as unknown as { __headingMutations: number }).__headingMutations = 0
      new MutationObserver((records) => {
        const w = window as unknown as { __headingMutations: number }
        for (const record of records) {
          if (record.type === 'characterData') w.__headingMutations += 1
          for (const node of record.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE) w.__headingMutations += 1
          }
        }
      }).observe(heading, { characterData: true, childList: true, subtree: true })
    })
    await page.getByTestId('out-accept').click()
    await expect(page.getByTestId('out-heading')).toContainText('October 2024')
    const mutations = await page.evaluate(
      () => (window as unknown as { __headingMutations: number }).__headingMutations
    )
    expect(mutations).toBe(1)
  })
});
