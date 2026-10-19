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
  test('PO-EVENT-01: consumer cancellation stops trigger and Close requests before transitions', async ({ mount, page }) => {
    const props: ContractProps = { cancelTrigger: true }
    const fixture = await mount('components/Popover/Popover/ContractHarness', props)
    const trigger = page.getByTestId('popover-contract-trigger')
    const requests = page.getByTestId('popover-contract-requests')
    const events = page.getByTestId('popover-contract-events')
    const content = page.getByTestId('popover-contract-content')

    await trigger.click()
    await trigger.focus()
    await trigger.press('Enter')
    await trigger.press('Space')
    await expect(events).toHaveText('trigger:false|trigger:false|trigger:false')
    await expect(requests).toHaveText('')
    await expect(content).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await fixture.update({ cancelTrigger: false, cancelClose: true } satisfies ContractProps)
    await trigger.press('Enter')
    await expect(content).toBeVisible()
    await expect(requests).toHaveText('initial:open|initial:change:true')
    await page.getByTestId('popover-contract-close').click()
    await expect(events).toHaveText('trigger:false|trigger:false|trigger:false|trigger:false|close:true')
    await expect(requests).toHaveText('initial:open|initial:change:true')
    await expect(content).toBeVisible()

    await fixture.update({ cancelClose: false } satisfies ContractProps)
    await page.getByTestId('popover-contract-close').click()
    await expect(requests).toHaveText('initial:open|initial:change:true|initial:change:false|initial:dismiss')
    await expect(content).toHaveCount(0)
  })
})
