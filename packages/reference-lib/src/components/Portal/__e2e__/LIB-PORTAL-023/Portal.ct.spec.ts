/**
 * Portal composition gates and browser proofs. Pins body placement for
 * omitted and null containers, relocation into resolved destinations
 * (including late refs, swaps, ShadowRoots, and iframes), logical context
 * and event bubbling, theme re-anchoring at the destination, and catalog
 * coverage for mixed, keyed, and empty children.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Portal ShadowRoot event contract (FEATURES #1, PORTAL-OWNS)', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Portal/Portal/ShadowFixture')
    await expect(page.getByTestId('portal-shadow-fixture-root')).toBeVisible()
  })

  test('PT-COMP-03: Shadow composition preserves context and one logical React event sequence', async ({
    page,
  }) => {
    await page.getByTestId('btn-shadow-attach').click()
    const btn = page.getByTestId('portal-shadow-btn')
    const host = page.getByTestId('portal-shadow-host')

    // Logical context crosses into the shadow destination.
    await expect(btn).toHaveAttribute('data-context-val', 'logical-provider-value')

    // Content handler fires exactly once, then the logical parent. The parent
    // entry repeats: React dispatches shadow-portal events twice — once with
    // the true target at the portal-container listener, once retargeted to the
    // host at the root-container listener. Portal owns delivery (content: once,
    // in order) and documents the ancestor duplicate; it must NOT suppress the
    // composed propagation, which outside-press and Escape contracts rely on.
    await btn.click()
    await expect(page.getByTestId('portal-shadow-click-log')).toHaveText(
      'child,logical-parent,logical-parent'
    )

    // Keyboard delivery: Enter on the shadow button fires React onKeyDown once.
    await btn.focus()
    await expect
      .poll(() =>
        host.evaluate(
          el => (el.shadowRoot?.activeElement as HTMLElement | null)?.getAttribute('data-testid')
        )
      )
      .toBe('portal-shadow-btn')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('portal-shadow-key-log')).toHaveText('child-enter')

    // Removal empties the shadow root completely.
    await page.getByTestId('btn-shadow-unmount').click()
    await expect(btn).toHaveCount(0)
    expect(await host.evaluate(el => el.shadowRoot?.childElementCount ?? -1)).toBe(0)
  })
});
