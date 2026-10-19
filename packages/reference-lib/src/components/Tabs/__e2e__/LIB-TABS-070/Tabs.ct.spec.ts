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
  test('TB-ENV-03: Tabs keep focus and linkage local inside a ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/ShadowTabs')
    await expect(page.getByTestId('tabs-shadow-root')).toBeVisible()

    const tabGeneral = page.getByTestId('tab-s-general')
    const tabBilling = page.getByTestId('tab-s-billing')
    const panelBilling = page.getByTestId('panel-s-billing')

    // Arrows move focus inside the shadow tree instead of going dead.
    await tabGeneral.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabBilling).toBeFocused()
    // Manual mode: selection stays on general until explicit activation.
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Enter')
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
    await expect(panelBilling).toBeVisible()
    await expect(page.getByTestId('tabs-shadow-log')).toHaveText('billing')

    // shadowRoot.activeElement is the Tab, not the host.
    const activeTestId = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="tabs-shadow-host"]')
      return (
        host?.shadowRoot?.activeElement?.getAttribute('data-testid') ?? null
      )
    })
    expect(activeTestId).toBe('tab-s-billing')

    // aria-controls/aria-labelledby resolve inside the same shadow root.
    const linkage = await page.evaluate(() => {
      const root = document.querySelector(
        '[data-testid="tabs-shadow-host"]'
      )?.shadowRoot
      if (!root) return null
      const tab = root.querySelector('[data-testid="tab-s-billing"]')
      const panel = root.querySelector('[data-testid="panel-s-billing"]')
      const controls = tab?.getAttribute('aria-controls')
      const labelledBy = panel?.getAttribute('aria-labelledby')
      return {
        controlsResolves: controls
          ? root.getElementById(controls)?.getAttribute('role')
          : null,
        labelledByResolves: labelledBy
          ? root.getElementById(labelledBy)?.getAttribute('role')
          : null,
      }
    })
    expect(linkage).toEqual({
      controlsResolves: 'tabpanel',
      labelledByResolves: 'tab',
    })
  })
});
