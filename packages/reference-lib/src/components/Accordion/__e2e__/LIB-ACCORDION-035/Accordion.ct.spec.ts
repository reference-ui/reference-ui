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
  test('AC-DOM-01: Accordion should render one root while preserving each Collapsible transparent disclosure anatomy', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/DomAnatomy')
    const before = page.getByTestId('dom-01-sibling-before')
    const root = page.getByTestId('dom-01-root')
    const after = page.getByTestId('dom-01-sibling-after')
    const trigger1 = page.getByTestId('btn-trigger-1')
    const content1 = page.getByTestId('content-1')
    const trigger2 = page.getByTestId('btn-trigger-2')
    const content2 = page.getByTestId('content-2')

    await expect(before).toBeVisible()
    await expect(root).toBeVisible()
    await expect(after).toBeVisible()

    // Assert Accordion contributes one native div
    const rootTagName = await root.evaluate(el => el.tagName.toLowerCase())
    expect(rootTagName).toBe('div')

    // Initial state: trigger 1 is expanded, content 1 visible
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false')
    await expect(content2).toHaveCount(0)

    // Direct children check: no item or header wrapper div inserted
    const childTagNames = await root.evaluate(el => Array.from(el.children).map(c => c.tagName.toLowerCase()))
    expect(childTagNames).toEqual(['button', 'div', 'div', 'button'])

    // Click trigger 2 -> trigger 1 closes, trigger 2 opens
    await trigger2.click()
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()
    await expect(content1).toHaveCount(0)
  })
})
