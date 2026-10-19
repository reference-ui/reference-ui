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
  test('AC-KEY-05: Accordion arrow and boundary keys should move focus without activating an item', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyNoActivate')
    const triggerA = page.getByTestId('noact-trigger-a')
    const triggerB = page.getByTestId('noact-trigger-b')
    const triggerC = page.getByTestId('noact-trigger-c')
    const log = page.getByTestId('key-no-act-log')

    await expect(triggerA).toHaveAttribute('aria-expanded', 'true')
    await expect(triggerB).toHaveAttribute('aria-expanded', 'false')

    await triggerA.focus()
    await page.keyboard.press('ArrowDown')
    await expect(triggerB).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(triggerC).toBeFocused()
    await page.keyboard.press('Home')
    await expect(triggerA).toBeFocused()
    await page.keyboard.press('End')
    await expect(triggerC).toBeFocused()

    // State remains unchanged
    await expect(triggerA).toHaveAttribute('aria-expanded', 'true')
    await expect(triggerB).toHaveAttribute('aria-expanded', 'false')
    await expect(triggerC).toHaveAttribute('aria-expanded', 'false')
    await expect(log).toHaveText('')
  })
})
