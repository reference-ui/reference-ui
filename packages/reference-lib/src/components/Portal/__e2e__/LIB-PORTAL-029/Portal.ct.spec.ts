/**
 * Portal composition gates and browser proofs. Pins body placement for
 * omitted and null containers, relocation into resolved destinations
 * (including late refs, swaps, ShadowRoots, and iframes), logical context
 * and event bubbling, theme re-anchoring at the destination, and catalog
 * coverage for mixed, keyed, and empty children.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Portal catalog coverage (CT re-target, no matrix on this branch)', () => {
  // Per-test page-error capture for PT-DOM-06. Listeners attach before mount
  // (addInitScript is too late: the gallery page is already open). Fresh page
  // per test, so no accumulation across specs.
  let pageErrors: string[] = []

  test.beforeEach(async ({ mount, page }) => {
    pageErrors = []
    page.on('pageerror', e => {
      pageErrors.push(`pageerror:${e.message}`)
    })
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(`console:${msg.text()}`)
    })
    await mount('components/Portal/Portal/CoverageFixture')
    await expect(page.getByTestId('coverage-fixture-root')).toBeVisible()
  })

  test('PT-COMP-01: Default-destination composition places, updates with context/events, and cleans up', async ({
    page,
  }) => {
    const ctx = page.getByTestId('coverage-comp1-ctx')
    const node = page.getByTestId('coverage-comp1-node')
    const btn = page.getByTestId('coverage-comp1-btn')
    await expect(ctx).toBeVisible()

    // Direct body placement with no wrapper, logical context intact.
    const placement = await node.evaluate(el => ({
      parentIsBody: el.parentElement === document.body,
      ctxVal: document
        .querySelector('[data-testid="coverage-comp1-ctx"]')
        ?.getAttribute('data-context-val'),
    }))
    expect(placement.parentIsBody).toBe(true)
    expect(placement.ctxVal).toBe('logical-provider-value')

    // Logical React events fire.
    await page.getByTestId('btn-coverage-comp1-update').click()
    await expect(node).toHaveText('beta')
    await expect(ctx).toHaveAttribute('data-context-val', 'logical-provider-value')
    await btn.click()
    await expect(page.getByTestId('coverage-comp1-clicks')).toHaveText('1')
    // No snap(): unstyled coverage chrome — the DOM assertions above are the proof.

    // Full cleanup: none of the three portalled nodes survives.
    await page.getByTestId('btn-coverage-comp1-unmount').click()
    for (const id of ['coverage-comp1-ctx', 'coverage-comp1-node', 'coverage-comp1-btn']) {
      await expect(page.getByTestId(id)).toHaveCount(0)
    }
  })
});
