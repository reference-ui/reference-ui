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
  test('TB-SELECT-05: click cancellation stops keyboard activation but cannot undo an earlier press request', async ({ mount, page }) => {
    const props: ContractProps = { cancelClick: true, activation: 'manual' }
    await mount('components/Tabs/Tabs/ControlledContract', props)
    const general = page.getByTestId('tabs-contract-general')
    const billing = page.getByTestId('tabs-contract-billing')
    const events = page.getByTestId('tabs-contract-events')
    const requests = page.getByTestId('tabs-contract-requests')

    await billing.focus()
    await billing.press('Enter')
    await billing.press('Space')
    await expect(events).toHaveText('click:general|click:general')
    await expect(requests).toHaveText('')
    await expect(general).toHaveAttribute('aria-selected', 'true')
    await expect(billing).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByTestId('tabs-contract-panel-general')).toBeVisible()
    await expect(page.getByTestId('tabs-contract-panel-billing')).toBeHidden()

    await general.focus()
    await billing.hover()
    await page.mouse.down()
    await expect(billing).toBeFocused()
    await expect(requests).toHaveText('initial:change:billing')
    await expect(events).toHaveText('click:general|click:general|change:general:billing')
    await expect(billing).toHaveAttribute('aria-selected', 'true')

    await page.mouse.up()
    await expect(events).toHaveText('click:general|click:general|change:general:billing|click:billing')
    await expect(requests).toHaveText('initial:change:billing')
    await expect(billing).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('tabs-contract-panel-billing')).toBeVisible()
    await expect(page.getByTestId('tabs-contract-panel-general')).toBeHidden()
  })
});
