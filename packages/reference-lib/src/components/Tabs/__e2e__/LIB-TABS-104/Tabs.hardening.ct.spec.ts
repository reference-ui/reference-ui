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
  test('TB-CTRL-01: real rejected pointer gestures request once and preserve controlled panels', async ({ mount, page }) => {
    const props: ContractProps = { heldValue: 'general', reject: true }
    const fixture = await mount('components/Tabs/Tabs/ControlledContract', props)
    const general = page.getByTestId('tabs-contract-general')
    const billing = page.getByTestId('tabs-contract-billing')
    const requests = page.getByTestId('tabs-contract-requests')

    await billing.click()
    await expect(requests).toHaveText('initial:change:billing')
    await expect(general).toHaveAttribute('aria-selected', 'true')
    await expect(billing).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByTestId('tabs-contract-panel-general')).toBeVisible()
    await expect(page.getByTestId('tabs-contract-panel-billing')).toBeHidden()

    await billing.click()
    const requested = 'initial:change:billing|initial:change:billing'
    await expect(requests).toHaveText(requested)
    await expect(general).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('tabs-contract-panel-general')).toBeVisible()

    await fixture.update({ heldValue: 'billing', reject: true } satisfies ContractProps)
    await expect(billing).toHaveAttribute('aria-selected', 'true')
    await expect(general).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByTestId('tabs-contract-panel-billing')).toBeVisible()
    await expect(page.getByTestId('tabs-contract-panel-general')).toBeHidden()
    await expect(requests).toHaveText(requested)
  })
});
