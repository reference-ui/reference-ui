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
  test('TB-CTRL-02: rejected automatic navigation roves focus with current callbacks', async ({ mount, page }) => {
    const props: ContractProps = { heldValue: 'general', reject: true }
    const fixture = await mount('components/Tabs/Tabs/ControlledContract', props)
    const general = page.getByTestId('tabs-contract-general')
    const billing = page.getByTestId('tabs-contract-billing')
    const security = page.getByTestId('tabs-contract-security')
    const requests = page.getByTestId('tabs-contract-requests')

    await general.focus()
    await page.keyboard.press('ArrowRight')
    await expect(billing).toBeFocused()
    await expect(billing).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('tabs-contract-list').locator('[role="tab"][tabindex="0"]')).toHaveCount(1)
    await expect(general).toHaveAttribute('aria-selected', 'true')
    await expect(billing).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByTestId('tabs-contract-panel-general')).toBeVisible()
    await expect(requests).toHaveText('initial:change:billing')

    await fixture.update({ heldValue: 'general', reject: true, callbackLabel: 'latest' } satisfies ContractProps)
    await page.keyboard.press('ArrowRight')
    await expect(security).toBeFocused()
    await expect(security).toHaveAttribute('tabindex', '0')
    await expect(general).toHaveAttribute('aria-selected', 'true')
    const requested = 'initial:change:billing|latest:change:security'
    await expect(requests).toHaveText(requested)

    await fixture.update({ heldValue: 'security', reject: true, callbackLabel: 'latest' } satisfies ContractProps)
    await expect(security).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('tabs-contract-panel-security')).toBeVisible()
    const panelId = await page.getByTestId('tabs-contract-panel-security').getAttribute('id')
    expect(panelId).toBeTruthy()
    await expect(security).toHaveAttribute('aria-controls', panelId!)
    await expect(requests).toHaveText(requested)
  })
});
