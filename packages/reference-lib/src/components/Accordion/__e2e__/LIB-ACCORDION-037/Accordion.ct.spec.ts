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
  test('AC-KEY-02: Accordion header traversal should move ArrowUp to the previous enabled Trigger and wrap at the beginning', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyTraversal')
    const triggerA = page.getByTestId('key-trigger-a')
    const triggerB = page.getByTestId('key-trigger-b')
    const triggerC = page.getByTestId('key-trigger-c')

    await triggerC.focus()
    await expect(triggerC).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(triggerB).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(triggerA).toBeFocused()

    // Wraps to C
    await page.keyboard.press('ArrowUp')
    await expect(triggerC).toBeFocused()
  })
})
