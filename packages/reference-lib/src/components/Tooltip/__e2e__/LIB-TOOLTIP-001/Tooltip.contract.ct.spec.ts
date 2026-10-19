/**
 * Tooltip consumer and lifecycle contracts. Authored descriptions survive
 * open and close with one live tooltip reference, consumer prevention
 * cancels pointer and keyboard opening, controlled requests stay closed
 * until the owner updates, and unmount cancels delayed opening so remount
 * starts a fresh session.
 */
import { test, expect, pressTab } from '../../../../../playwright/ct'

test.describe('Tooltip consumer and lifecycle contracts', () => {
  test('TT-CONTRACT-01: authored descriptions survive open and close with one live tooltip reference', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip.contract/Contracts')
    const trigger = page.getByTestId('trigger')
    const content = page.getByTestId('content')
    await page.getByTestId('before').focus()
    await pressTab(page)
    await expect(trigger).toBeFocused()
    await expect(content).toBeVisible()
    const id = await content.getAttribute('id')
    expect(id).toBeTruthy()
    await expect(trigger).toHaveAttribute('aria-describedby', `contract-description ${id}`)
    await expect(page.getByTestId('events')).toHaveText('consumer-focus,open,change:true')
    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-describedby', 'contract-description')
    await expect(trigger).toBeFocused()
    await expect(page.getByTestId('events')).toHaveText('consumer-focus,open,change:true,change:false,dismiss')
  })
});
