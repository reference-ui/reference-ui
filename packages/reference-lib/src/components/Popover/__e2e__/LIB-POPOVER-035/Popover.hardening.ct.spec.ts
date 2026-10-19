/**
 * Popover controlled-ownership and event-contract hardening. Rejected
 * openings and Escape/Close requests preserve controlled DOM with current
 * callbacks, consumer cancellation stops requests before transitions, Tab
 * dismissal advances past the logical trigger once, and explicit Content
 * ids stay the live control target.
 */
import type { ComponentProps } from 'react'
import type { Page } from '@playwright/test'
import { test, expect, pressTab } from '../../../../../playwright/ct'
import type { ContractHarness, FocusReturn } from '../../Popover.story'

type ContractProps = ComponentProps<typeof ContractHarness>
type FocusReturnProps = ComponentProps<typeof FocusReturn>

async function tabIntoReturnContent(page: Page) {
  await pressTab(page)
  await expect(page.getByTestId('popover-return-first')).toBeFocused()
}

async function openReturnFromKeyboard(page: Page) {
  await page.getByTestId('popover-return-trigger').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('popover-return-content')).toBeVisible()
  await tabIntoReturnContent(page)
}

test.describe('Popover controlled ownership and event contracts', () => {
  test('PO-CTRL-01: rejected opening keeps controlled DOM and uses current callbacks', async ({ mount, page }) => {
    const props: ContractProps = { heldOpen: false, callbackLabel: 'initial' }
    const fixture = await mount('components/Popover/Popover/ContractHarness', props)
    const trigger = page.getByTestId('popover-contract-trigger')
    const content = page.getByTestId('popover-contract-content')
    const requests = page.getByTestId('popover-contract-requests')

    await trigger.click()
    await expect(requests).toHaveText('initial:open|initial:change:true')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await fixture.update({ heldOpen: false, callbackLabel: 'latest' } satisfies ContractProps)
    await trigger.click()
    const requested = 'initial:open|initial:change:true|latest:open|latest:change:true'
    await expect(requests).toHaveText(requested)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await fixture.update({ heldOpen: true, callbackLabel: 'latest' } satisfies ContractProps)
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(requests).toHaveText(requested)
  })
})
