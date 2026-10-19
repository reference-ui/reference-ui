/**
 * Tooltip consumer and lifecycle contracts. Authored descriptions survive
 * open and close with one live tooltip reference, consumer prevention
 * cancels pointer and keyboard opening, controlled requests stay closed
 * until the owner updates, and unmount cancels delayed opening so remount
 * starts a fresh session.
 */
import { test, expect, pressTab } from '../../../../../playwright/ct'

test.describe('Tooltip consumer and lifecycle contracts', () => {
  test('TT-CONTRACT-03: controlled requests stay closed until the owner updates and updates emit no requests', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip.contract/Contracts', { controlled: true })
    await page.getByTestId('before').focus()
    await pressTab(page)
    await expect(page.getByTestId('events')).toHaveText('consumer-focus,open,change:true')
    await expect(page.getByTestId('content')).toHaveCount(0)
    // Owner updates must be isolated from outside-pointer dismissal.
    await page.getByTestId('set-open').evaluate(element => (element as HTMLButtonElement).click())
    await expect(page.getByTestId('content')).toBeVisible()
    await expect(page.getByTestId('events')).toHaveText('consumer-focus,open,change:true')
    await page.getByTestId('set-closed').evaluate(element => (element as HTMLButtonElement).click())
    await expect(page.getByTestId('content')).toHaveCount(0)
    await expect(page.getByTestId('events')).toHaveText('consumer-focus,open,change:true')
  })
});
