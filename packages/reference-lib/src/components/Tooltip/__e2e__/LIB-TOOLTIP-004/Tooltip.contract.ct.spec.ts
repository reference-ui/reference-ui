/**
 * Tooltip consumer and lifecycle contracts. Authored descriptions survive
 * open and close with one live tooltip reference, consumer prevention
 * cancels pointer and keyboard opening, controlled requests stay closed
 * until the owner updates, and unmount cancels delayed opening so remount
 * starts a fresh session.
 */
import { test, expect, pressTab } from '../../../../../playwright/ct'

test.describe('Tooltip consumer and lifecycle contracts', () => {
  test('TT-CONTRACT-04: unmount cancels delayed opening and remount starts a fresh session', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip.contract/Contracts')
    await page.getByTestId('trigger').hover()
    await expect(page.getByTestId('events')).toHaveText('consumer-enter')
    await page.getByTestId('toggle-mount').evaluate(element => (element as HTMLButtonElement).click())
    await expect(page.getByTestId('trigger')).toHaveCount(0)
    await page.waitForTimeout(300)
    await expect(page.getByTestId('content')).toHaveCount(0)
    await expect(page.getByTestId('events')).toHaveText('consumer-enter')
    await page.mouse.move(0, 0)
    await page.getByTestId('toggle-mount').click()
    await expect(page.getByTestId('trigger')).toBeVisible()
    await expect(page.getByTestId('content')).toHaveCount(0)
    await page.getByTestId('trigger').hover()
    await expect(page.getByTestId('content')).toBeVisible()
    await expect(page.getByTestId('events')).toHaveText('consumer-enter,consumer-enter,open,change:true')
  })
});
