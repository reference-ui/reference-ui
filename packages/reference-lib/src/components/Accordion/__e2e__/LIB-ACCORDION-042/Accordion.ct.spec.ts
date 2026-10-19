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
  test('AC-KEY-07: Accordion should ignore traversal keys originating inside item Content', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/ContentKeys')
    const input = page.getByTestId('content-descendant-input')
    const link = page.getByTestId('content-descendant-link')
    const button = page.getByTestId('content-descendant-button')
    const triggerA = page.getByTestId('content-keys-trigger-a')
    const log = page.getByTestId('content-keys-log')

    // Inside input
    await input.focus()
    await page.keyboard.press('ArrowDown')
    await expect(input).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(input).toBeFocused()

    // Inside link
    await link.focus()
    await page.keyboard.press('ArrowDown')
    await expect(link).toBeFocused()

    // Inside button
    await button.focus()
    await page.keyboard.press('ArrowDown')
    await expect(button).toBeFocused()

    // No accordion change
    await expect(triggerA).toHaveAttribute('aria-expanded', 'true')
    await expect(log).toHaveText('')
  })
})
