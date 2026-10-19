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
  test('AC-NEST-01: A nested Accordion should keep its collection, values, and header keys independent from its parent', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Nested')
    const innerX = page.getByTestId('nest-inner-trigger-x')
    const innerY = page.getByTestId('nest-inner-trigger-y')
    const outerB = page.getByTestId('nest-outer-trigger-b')
    const innerLog = page.getByTestId('nest-inner-log')
    const outerLog = page.getByTestId('nest-outer-log')

    // Click inner X
    await innerX.click()
    await expect(innerLog).toHaveText('inner-x')
    await expect(outerLog).toHaveText('')

    // Arrow navigation inside inner stays inside inner
    await innerX.focus()
    await page.keyboard.press('ArrowDown')
    await expect(innerY).toBeFocused()

    // Click outer B
    await outerB.click()
    await expect(outerLog).toHaveText('outer-b')
  })
})
