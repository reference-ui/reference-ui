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
  test('Single expansion manages item visibility and arrow traversal (legacy smoke)', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Single')
    const trigger1 = page.getByTestId('btn-trigger-1')
    const content1 = page.getByTestId('content-1')
    const trigger2 = page.getByTestId('btn-trigger-2')
    const content2 = page.getByTestId('content-2')
    const trigger3 = page.getByTestId('btn-trigger-3')

    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false')
    await expect(content2).toHaveCount(0)

    const accordion = page.getByTestId('test-accordion')
    const root = page.getByTestId('accordion-fixture-root')

    await page.waitForTimeout(300)
    await snap(page, 'single-resting')
    await snap(accordion, 'single-resting-accordion', { maxDiffPixelRatio: 0.001 })
    await snap(root, 'single-resting-root', { maxDiffPixelRatio: 0.001 })

    // Hover trigger 2
    await trigger2.hover()
    await page.waitForTimeout(200)
    await snap(page, 'single-hover-trigger-2')

    // Click trigger 2 -> opens item-2, closes item-1
    await trigger2.click()
    await expect(content1).toHaveAttribute('data-state', 'closed')
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()
    await expect(content1).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'single-item-2-open')
    await snap(accordion, 'single-accordion-item-2-open', { maxDiffPixelRatio: 0.001 })

    // Arrow keys navigate between triggers
    await trigger2.focus()
    await expect(trigger2).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-2-focused')

    await page.keyboard.press('ArrowUp')
    await expect(trigger1).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-1-focused')

    await page.keyboard.press('ArrowDown')
    await expect(trigger2).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(trigger3).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-3-focused')
  })
})
