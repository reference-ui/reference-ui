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
  test('AC-FIND-CT-01: native beforematch swaps the single-mode open item and reveals the match', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/FindSwap')
    const trigger1 = page.getByTestId('btn-find-trigger-1')
    const trigger2 = page.getByTestId('btn-find-trigger-2')
    const content1 = page.getByTestId('find-content-1')
    const content2 = page.getByTestId('find-content-2')

    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    // hidden=until-found skips contents (the panel's own 1px divider border
    // still paints, so assert the skip, not whole-box hiddenness).
    await expect(content2).toHaveAttribute('hidden', 'until-found')
    expect(await content2.evaluate((el) => getComputedStyle(el).contentVisibility)).toBe('hidden')
    // WebKit parses content-visibility:hidden (asserted above) but
    // does not skip until-found contents at paint — the span stays visible.
    // The hidden attribute + computed style + beforematch swap below are the
    // product contract and hold on both engines.
    if (engineOf() === 'webkit') {
      await expect(content2.locator('span')).toBeVisible()
    } else {
      await expect(content2.locator('span')).toBeHidden()
    }

    await content2.evaluate((el) => {
      el.dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })

    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(content2).toBeVisible()
    await expect(content1).toHaveAttribute('hidden', 'until-found')
    expect(await content1.evaluate((el) => getComputedStyle(el).contentVisibility)).toBe('hidden')
    // swapped leg: same until-found paint split as above.
    if (engineOf() === 'webkit') {
      await expect(content1.locator('span')).toBeVisible()
    } else {
      await expect(content1.locator('span')).toBeHidden()
    }
  })
})
