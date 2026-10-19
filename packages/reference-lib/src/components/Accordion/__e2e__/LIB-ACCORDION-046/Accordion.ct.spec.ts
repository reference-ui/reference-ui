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
  test('AC-KEY-11: Accordion should keep every enabled header in the browsers native Tab sequence even after arrow focus moves', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/TabSequence')
    const beforeLink = page.getByTestId('tab-link-before')
    const headerA = page.getByTestId('tab-trigger-a')
    const headerB = page.getByTestId('tab-trigger-b')
    const innerBtn = page.getByTestId('tab-content-inner-btn')
    const headerC = page.getByTestId('tab-trigger-c')
    const afterLink = page.getByTestId('tab-link-after')

    // Verify native tabIndex property is 0 and not roving (-1)
    expect(await headerA.evaluate(el => (el as HTMLElement).tabIndex)).toBe(0)
    expect(await headerB.evaluate(el => (el as HTMLElement).tabIndex)).toBe(0)
    expect(await headerC.evaluate(el => (el as HTMLElement).tabIndex)).toBe(0)
    await expect(headerA).not.toHaveAttribute('tabindex', '-1')
    await expect(headerB).not.toHaveAttribute('tabindex', '-1')
    await expect(headerC).not.toHaveAttribute('tabindex', '-1')

    // Move focus via arrow key first
    await headerA.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(headerC).toBeFocused()

    // the tabIndex + arrow assertions above are the product
    // contract (headers in the tab sequence, arrow moves focus) and hold on
    // WebKit. The native Tab walk below is platform traversal — Safari skips
    // buttons/links — so it runs on Chromium/Firefox only.
    if (engineOf() === 'webkit') return

    // Tab sequence from beginning
    await beforeLink.focus()
    await page.keyboard.press('Tab')
    await expect(headerA).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(headerB).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(innerBtn).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(headerC).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(afterLink).toBeFocused()

    // Shift+Tab back
    await page.keyboard.press('Shift+Tab')
    await expect(headerC).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(innerBtn).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(headerB).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(headerA).toBeFocused()
  })
})
