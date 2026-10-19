/**
 * Accordion browser proofs: composition gates plus the AC-DOM, AC-KEY,
 * AC-NEST, AC-PRES, AC-A11Y, AC-COMP, and AC-FIND-CT case rows. Mounts the
 * story fixtures and asserts expansion, traversal, nesting, and presence
 * in a real browser with axe checks on the accessibility rows.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

// Landing-sequence engine scope: `engineOf` sniffs the Playwright project
// (`react19` on agentct Chromium, `react19-firefox`/`react19-webkit` on the
// sweep vehicle) for per-engine delivery/expectations.
function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

test.describe('Accordion Composition Gates & Browser Proofs', () => {
  test('AC-KEY-09: Accordion should let consumer key cancellation run before header navigation or native activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyCancel')
    const cancelTrigger = page.getByTestId('cancel-trigger-b')
    const cancelLog = page.getByTestId('cancel-log')

    await cancelTrigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(cancelTrigger).toBeFocused()
    await page.keyboard.press('Home')
    await expect(cancelTrigger).toBeFocused()
    await page.keyboard.press('Space')
    await expect(cancelTrigger).toBeFocused()

    await expect(cancelLog).toHaveText('canceled:ArrowDown,canceled:Home,canceled: ')
  })
})
