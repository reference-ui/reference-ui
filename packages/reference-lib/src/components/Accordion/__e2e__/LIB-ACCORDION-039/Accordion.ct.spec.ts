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
  test('AC-KEY-04: Accordion header traversal should skip every disabled item, including a trigger disabled after it held focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyDisabled')
    const triggerA = page.getByTestId('dyn-trigger-a')
    const triggerB = page.getByTestId('dyn-trigger-b')
    const triggerD = page.getByTestId('dyn-trigger-d')
    const toggleBtn = page.getByTestId('btn-toggle-dyn-disabled')

    // 1. A enabled, B/C disabled, D enabled: A ArrowDown skips B and C to reach D
    await triggerA.focus()
    await page.keyboard.press('ArrowDown')
    await expect(triggerD).toBeFocused()

    // D ArrowUp skips C and B to reach A
    await page.keyboard.press('ArrowUp')
    await expect(triggerA).toBeFocused()

    // 2. Enable B so it can hold focus
    await toggleBtn.click()
    await expect(triggerB).toBeEnabled()
    await triggerB.focus()
    await expect(triggerB).toBeFocused()

    // Rerender B disabled while retaining active DOM node
    await toggleBtn.dispatchEvent('click')
    await expect(triggerB).toBeDisabled()

    // Dispatch ArrowDown from that retained node
    await triggerB.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })))
    await expect(triggerD).toBeFocused()
  })
})
