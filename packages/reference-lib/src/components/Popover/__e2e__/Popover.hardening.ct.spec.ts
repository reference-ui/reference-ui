import type { ComponentProps } from 'react'
import { test, expect, pressTab } from '../../../../playwright/ct'
import type { ContractHarness } from '../Popover.story'

type ContractProps = ComponentProps<typeof ContractHarness>

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

  test('PO-FOCUS-01: rejected Tab dismissal advances beyond the logical trigger once', async ({ mount, page }) => {
    const props: ContractProps = { heldOpen: true }
    await mount('components/Popover/Popover/ContractHarness', props)
    const trigger = page.getByTestId('popover-contract-trigger')
    const content = page.getByTestId('popover-contract-content')
    const requests = page.getByTestId('popover-contract-requests')

    await expect(content).toBeVisible()
    await trigger.focus()
    await pressTab(page)
    await expect(page.getByTestId('popover-contract-first')).toBeFocused()
    await pressTab(page)
    await expect(page.getByTestId('popover-contract-close')).toBeFocused()
    await pressTab(page)
    await expect(page.getByTestId('popover-contract-after')).toBeFocused()
    await expect(requests).toHaveText('initial:change:false|initial:dismiss')
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await pressTab(page)
    await expect(page.getByTestId('popover-contract-last')).toBeFocused()
    await expect(requests).toHaveText('initial:change:false|initial:dismiss')
  })

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
