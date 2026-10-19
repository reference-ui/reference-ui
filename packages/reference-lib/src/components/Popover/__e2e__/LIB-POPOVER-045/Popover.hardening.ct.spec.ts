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

test.describe('Popover focus return', () => {
  test('PO-FOCUS-07: an outside press from inside Content keeps the pressed control focused', async ({ mount, page }) => {
    await mount('components/Popover/Popover/FocusReturn')

    await openReturnFromKeyboard(page)
    await page.getByTestId('popover-return-after').click()
    await expect(page.getByTestId('popover-return-content')).toHaveCount(0)
    await expect(page.getByTestId('popover-return-after')).toBeFocused()
  })
})
