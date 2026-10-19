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
  test('PO-CTRL-02: rejected Escape and Close requests preserve active controlled content', async ({ mount, page }) => {
    const props: ContractProps = { heldOpen: true }
    const fixture = await mount('components/Popover/Popover/ContractHarness', props)
    const content = page.getByTestId('popover-contract-content')
    const trigger = page.getByTestId('popover-contract-trigger')
    const requests = page.getByTestId('popover-contract-requests')
    const closeRequest = 'initial:change:false|initial:dismiss'

    await expect(content).toBeVisible()
    await page.getByTestId('popover-contract-first').focus()
    await page.keyboard.press('Escape')
    await expect(requests).toHaveText(closeRequest)
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await page.getByTestId('popover-contract-close').click()
    await expect(requests).toHaveText(`${closeRequest}|${closeRequest}`)
    await expect(content).toBeVisible()
    await page.keyboard.press('Escape')
    const requested = `${closeRequest}|${closeRequest}|${closeRequest}`
    await expect(requests).toHaveText(requested)
    await expect(content).toBeVisible()

    await fixture.update({ heldOpen: false } satisfies ContractProps)
    await expect(content).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(requests).toHaveText(requested)
  })
})
