/**
 * Tabs controlled-gesture hardening. Rejected pointer gestures request
 * once and preserve controlled panels, rejected automatic navigation
 * roves focus with current callbacks, canceled native presses suppress
 * their click, and click cancellation stops keyboard activation without
 * undoing an earlier press request.
 */
import type { ComponentProps } from 'react'
import { test, expect } from '../../../../../playwright/ct'
import type { ControlledContract } from '../../Tabs.story'

type ContractProps = ComponentProps<typeof ControlledContract>

test.describe('Tabs controlled gesture contracts', () => {
  test('TB-EVENT-03: canceled native press suppresses its click and allows the next gesture', async ({ mount, page }) => {
    const props: ContractProps = { cancelPress: true }
    const fixture = await mount('components/Tabs/Tabs/ControlledContract', props)
    const billing = page.getByTestId('tabs-contract-billing')
    const requests = page.getByTestId('tabs-contract-requests')

    await billing.click()
    await expect(page.getByTestId('tabs-contract-events')).toContainText('pointerdown:general')
    await expect(requests).toHaveText('')
    await expect(page.getByTestId('tabs-contract-general')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('tabs-contract-panel-general')).toBeVisible()

    await fixture.update({ cancelPress: false } satisfies ContractProps)
    await billing.click()
    await expect(requests).toHaveText('initial:change:billing')
    await expect(billing).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('tabs-contract-panel-billing')).toBeVisible()
  })
});
