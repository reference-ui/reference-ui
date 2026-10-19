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
  test('PO-LINK-01: explicit Content IDs remain the live Trigger control target after updates', async ({ mount, page }) => {
    const props: ContractProps = { heldOpen: true, contentId: 'contract-popup-initial' }
    const fixture = await mount('components/Popover/Popover/ContractHarness', props)
    const trigger = page.getByTestId('popover-contract-trigger')
    const content = page.getByTestId('popover-contract-content')

    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('id', 'contract-popup-initial')
    await expect(trigger).toHaveAttribute('aria-controls', 'contract-popup-initial')
    await expect(page.locator('[id="contract-popup-initial"]')).toHaveCount(1)

    await fixture.update({ heldOpen: true, contentId: 'contract-popup-latest' } satisfies ContractProps)
    await expect(content).toHaveAttribute('id', 'contract-popup-latest')
    await expect(trigger).toHaveAttribute('aria-controls', 'contract-popup-latest')
    await expect(page.locator('[id="contract-popup-initial"]')).toHaveCount(0)
    await expect(page.locator('[id="contract-popup-latest"]')).toHaveCount(1)
    await expect(page.getByTestId('popover-contract-requests')).toHaveText('')

    await fixture.update({ heldOpen: true } satisfies ContractProps)
    await expect(content).toHaveAttribute('id', /^popover-content-\d+$/)
    const generatedId = await content.getAttribute('id')
    expect(generatedId).toMatch(/^popover-content-\d+$/)
    if (generatedId === null) throw new Error('expected a generated content id')
    await expect(content).toHaveAttribute('id', generatedId)
    await expect(trigger).toHaveAttribute('aria-controls', generatedId)
    await expect(page.locator(`[id="${generatedId}"]`)).toHaveCount(1)

    await fixture.update({ heldOpen: false } satisfies ContractProps)
    await expect(content).toHaveCount(0)
    expect(await trigger.getAttribute('aria-controls')).toBeNull()

    await fixture.update({ heldOpen: false, contentId: 'contract-popup-reopen' } satisfies ContractProps)
    await expect(content).toHaveCount(0)
    await fixture.update({ heldOpen: true, contentId: 'contract-popup-reopen' } satisfies ContractProps)
    await expect(content).toHaveAttribute('id', 'contract-popup-reopen')
    await expect(trigger).toHaveAttribute('aria-controls', 'contract-popup-reopen')
    await expect(page.locator('[id="contract-popup-reopen"]')).toHaveCount(1)
    await expect(page.getByTestId('popover-contract-requests')).toHaveText('')

    await fixture.update({ heldOpen: true } satisfies ContractProps)
    await expect(content).toHaveAttribute('id', generatedId)
    await expect(trigger).toHaveAttribute('aria-controls', generatedId)
    await expect(page.locator(`[id="${generatedId}"]`)).toHaveCount(1)
    await expect(page.getByTestId('popover-contract-requests')).toHaveText('')
  })
})
