/**
 * Tooltip consumer and lifecycle contracts. Authored descriptions survive
 * open and close with one live tooltip reference, consumer prevention
 * cancels pointer and keyboard opening, controlled requests stay closed
 * until the owner updates, and unmount cancels delayed opening so remount
 * starts a fresh session.
 */
import { test, expect, pressTab } from '../../../../../playwright/ct'

test.describe('Tooltip consumer and lifecycle contracts', () => {
  test('TT-CONTRACT-02: consumer prevention cancels pointer and keyboard focus opening', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip.contract/Contracts', { cancel: true })
    await page.getByTestId('trigger').hover()
    await page.waitForTimeout(300)
    await expect(page.getByTestId('content')).toHaveCount(0)
    await expect(page.getByTestId('events')).toHaveText('consumer-enter')
    await page.mouse.move(0, 0)
    await page.getByTestId('before').focus()
    await pressTab(page)
    await expect(page.getByTestId('trigger')).toBeFocused()
    await expect(page.getByTestId('content')).toHaveCount(0)
    await expect(page.getByTestId('events')).toHaveText('consumer-enter,consumer-focus')
  })
});
