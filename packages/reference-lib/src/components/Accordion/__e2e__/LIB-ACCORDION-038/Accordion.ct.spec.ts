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
  test('AC-KEY-03: Accordion header traversal should send Home and End to the enabled boundaries', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyBoundaries')
    const triggerA = page.getByTestId('bound-trigger-a')
    const triggerC = page.getByTestId('bound-trigger-c')
    const triggerD = page.getByTestId('bound-trigger-d')

    await triggerC.focus()
    await expect(triggerC).toBeFocused()

    await page.keyboard.press('Home')
    await expect(triggerA).toBeFocused()

    await triggerC.focus()
    await expect(triggerC).toBeFocused()

    await page.keyboard.press('End')
    await expect(triggerD).toBeFocused()
  })
})
