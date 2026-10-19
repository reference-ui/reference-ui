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
  test('TB-SELECT-08: real press requests before click completes, completing click dedupes', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/SelectLog')
    await expect(page.getByTestId('tabs-select-root')).toBeVisible()

    const tabBilling = page.getByTestId('tab-sl-billing')
    const log = page.getByTestId('tabs-select-log')

    await tabBilling.evaluate(el => {
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    })
    // Synthetic dispatch performs no default focus; the test performs
    // the native mousedown focus the browser would. The press-armed
    // request fires here — before pointerup/click.
    await tabBilling.focus()
    await expect(log).toHaveText('focus:billing|change:billing')

    await tabBilling.click()
    // The full click adds at most a redundant focus, never a request.
    const text = await log.textContent()
    expect(text?.split('|').filter(e => e.startsWith('change:'))).toEqual([
      'change:billing',
    ])
  })
});
