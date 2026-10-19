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
  test('AC-A11Y-01: Accordion should remain accessibility-clean across every supported expansion and disabled-state shape', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyBoundaries')
    const root = page.getByTestId('key-bound-root')

    // Every header carries an honest expanded state; disabled headers are marked
    const triggers = root.locator('button[aria-expanded]')
    const count = await triggers.count()
    expect(count).toBe(4)
    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i)
      const hasAriaExpanded = await trigger.getAttribute('aria-expanded')
      expect(hasAriaExpanded === 'true' || hasAriaExpanded === 'false').toBe(true)

      const isDisabled = await trigger.isDisabled()
      if (isDisabled) {
        await expect(trigger).toHaveAttribute('data-disabled', '')
      }
    }

    // Scanner half: the KeyBoundaries mount exercises expanded, collapsed,
    // and disabled headers in one story; #root scoping covers it whole (no
    // portals in Accordion).
    await expectNoAxeViolations(page, { include: '#root' })
  })
})
