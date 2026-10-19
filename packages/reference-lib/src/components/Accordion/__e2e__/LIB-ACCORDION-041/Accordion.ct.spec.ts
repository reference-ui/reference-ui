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
  test('AC-KEY-06: Accordion should apply single or multiple expansion policy exactly once for native Space and Enter activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/NativeKeys')
    const singleTriggerB = page.getByTestId('native-single-trigger-b')
    const singleLog = page.getByTestId('native-single-log')

    // Single Space activation
    await singleTriggerB.focus()
    await page.keyboard.press('Space')
    await expect(singleLog).toHaveText('b')

    // Multiple Space activation
    const multiTriggerB = page.getByTestId('native-multi-trigger-b')
    const multiLog = page.getByTestId('native-multi-log')

    await multiTriggerB.focus()
    await page.keyboard.press('Space')
    await expect(multiLog).toHaveText('b')

    // Enter toggle
    await page.keyboard.press('Enter')
    await expect(multiLog).toHaveText('b;')
  })
})
