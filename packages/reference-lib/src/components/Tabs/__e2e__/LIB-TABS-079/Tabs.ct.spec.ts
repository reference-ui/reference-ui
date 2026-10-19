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
  test('TB-EVENT-02: typing Space and Enter in a portalled editable never selects', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/EventScope')
    await expect(page.getByTestId('tabs-ev-root')).toBeVisible()

    const input = page.getByTestId('tab-ev-portalled')
    await expect(input).toBeAttached()
    // Portalled in the DOM: outside the tab subtree.
    const insideTab = await input.evaluate(
      el => el.closest('[role="tab"]') !== null
    )
    expect(insideTab).toBe(false)

    await input.click()
    await input.pressSequentially('x y', { delay: 20 })
    await input.press('Enter')
    await expect(input).toHaveValue('x y')
    await expect(page.getByTestId('tabs-ev-log')).toHaveText('')
    await expect(page.getByTestId('tab-ev-general')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByTestId('tab-ev-security')).toHaveAttribute(
      'aria-selected',
      'false'
    )
  })
});
