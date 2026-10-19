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
  test('TB-EVENT-01: typing Space and Enter in a nested editable never selects', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/EventScope')
    await expect(page.getByTestId('tabs-ev-root')).toBeVisible()

    const input = page.getByTestId('tab-ev-nested')
    await input.click()
    await input.pressSequentially('a b', { delay: 20 })
    await input.press('Enter')
    await expect(input).toHaveValue('a b')
    await expect(input).toBeFocused()
    await expect(page.getByTestId('tabs-ev-log')).toHaveText('')
    await expect(page.getByTestId('tab-ev-general')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByTestId('tab-ev-billing')).toHaveAttribute(
      'aria-selected',
      'false'
    )
  })
});
