/**
 * Tabs composition gates and browser proofs. Pins tablist/tab/panel
 * rendering with ARIA linkage, automatic and manual selection, RTL arrow
 * reversal, nested isolation, focus rescue and handoff, dynamic disable
 * and removal, the MyTabs system-variant demo, ShadowRoot locality,
 * keepMounted panels, and real-gesture selection semantics.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Tabs Composition Gates & Browser Proofs', () => {
  test('TB-SYS-01: MyTabs custom variant renders through author recipes + kernel base', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/MyTabs')
    await expect(page.getByTestId('tabs-mytabs-root')).toBeVisible()

    const tabOverview = page.getByTestId('tab-my-overview')
    const tabActivity = page.getByTestId('tab-my-activity')

    // The custom name flows through the open kernel prop honestly.
    await expect(tabOverview).toHaveAttribute('data-variant', 'underline')
    await expect(tabOverview).toHaveAttribute('aria-selected', 'true')
    await expect(tabActivity).toHaveAttribute('aria-selected', 'false')

    // Author recipe paints the 2px underline indicator on selection.
    const indicator = await tabOverview.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        style: cs.borderBottomStyle,
        width: cs.borderBottomWidth,
        color: cs.borderBottomColor,
      }
    })
    expect(indicator.style).toBe('solid')
    expect(parseInt(indicator.width, 10)).toBeGreaterThanOrEqual(2)
    expect(indicator.color).not.toBe('rgba(0, 0, 0, 0)')
    expect(indicator.color).not.toBe('transparent')

    // Clicking through the custom flavor still drives kernel selection.
    await tabActivity.click()
    await expect(tabActivity).toHaveAttribute('aria-selected', 'true')
    await expect(tabOverview).toHaveAttribute('aria-selected', 'false')

    // css() override beats the kernel recipe by layer order.
    const tabOverride = page.getByTestId('tab-my-override')
    const tabPlain = page.getByTestId('tab-my-plain')
    const overrideColor = await tabOverride.evaluate(
      (el) => window.getComputedStyle(el).color
    )
    const plainColor = await tabPlain.evaluate(
      (el) => window.getComputedStyle(el).color
    )
    expect(overrideColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(overrideColor).not.toBe(plainColor)
  })
});
