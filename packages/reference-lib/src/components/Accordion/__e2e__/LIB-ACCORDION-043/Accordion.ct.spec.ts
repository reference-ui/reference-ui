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
  test('AC-KEY-08: Accordion should leave header navigation entirely native when keyboard traversal is disabled', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyboardNone')
    const triggerB = page.getByTestId('none-trigger-b')
    const log = page.getByTestId('none-key-log')

    await triggerB.focus()
    await page.keyboard.press('ArrowDown')
    await expect(triggerB).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(triggerB).toBeFocused()
    await page.keyboard.press('Home')
    await expect(triggerB).toBeFocused()
    await page.keyboard.press('End')
    await expect(triggerB).toBeFocused()

    // Activation still functions
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('b')
  })
})
