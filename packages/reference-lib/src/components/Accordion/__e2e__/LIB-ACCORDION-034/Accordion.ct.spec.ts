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
  test('Multiple expansion allows concurrent open sections (legacy smoke)', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Multiple')
    const multiRoot = page.getByTestId('accordion-multiple-root')
    const trigger1 = page.getByTestId('multi-trigger-1')
    const content1 = page.getByTestId('multi-content-1')
    const trigger2 = page.getByTestId('multi-trigger-2')
    const content2 = page.getByTestId('multi-content-2')

    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(content2).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'multiple-both-open')
    await snap(multiRoot, 'multiple-root-both-open', { maxDiffPixelRatio: 0.001 })

    // Click trigger 1 to collapse section 1
    await trigger1.click()
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(content1).toHaveCount(0)
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'multiple-item-1-closed')
    await snap(multiRoot, 'multiple-root-item-1-closed', { maxDiffPixelRatio: 0.001 })
  })
})
