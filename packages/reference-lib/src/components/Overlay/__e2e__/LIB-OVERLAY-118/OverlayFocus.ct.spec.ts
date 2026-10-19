/**
 * FocusLock × Overlay integration proof. Pins trapping while Content is
 * closed-but-mounted, single restore after Presence teardown, proximity
 * walks, nested-lock pausing, and modeless Content as a parent-lock
 * shard, each against the shared focus fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('FocusLock × Overlay', () => {
  test.afterEach(async ({ page }) => { await page.evaluate(() => window.scrollTo(0, 0)) })

  test('FL-OV-05 & FL-RESTORE-03 & FL-RESTORE-04 & FL-RESTORE-05: proximity walk after Presence', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Focus')
    await expect(page.getByTestId('focus-lock-overlay-root')).toBeVisible()

    await page.getByTestId('fl-ov-right-opener').click()
    await expect(page.getByTestId('fl-ov-right-content')).toBeVisible()
    await page.getByTestId('fl-ov-right-remove-close').click()
    await expect(page.getByTestId('fl-ov-right-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-right-opener')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-right-sibling')).toBeFocused()

    await page.getByTestId('fl-ov-left-opener').click()
    await expect(page.getByTestId('fl-ov-left-content')).toBeVisible()
    await page.getByTestId('fl-ov-left-remove-close').click()
    await expect(page.getByTestId('fl-ov-left-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-left-opener')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-left-sibling')).toBeFocused()

    await page.getByTestId('fl-ov-ancestor-opener').click()
    await expect(page.getByTestId('fl-ov-ancestor-content')).toBeVisible()
    await page.getByTestId('fl-ov-ancestor-remove-close').click()
    await expect(page.getByTestId('fl-ov-ancestor-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-ancestor-opener')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-ancestor')).toBeFocused()

    await page.getByTestId('fl-ov-disabled-opener').click()
    await expect(page.getByTestId('fl-ov-disabled-content')).toBeVisible()
    await page.getByTestId('fl-ov-disabled-close').click()
    await expect(page.getByTestId('fl-ov-disabled-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-disabled-opener')).toBeDisabled()
    await expect(page.getByTestId('fl-ov-disabled-sibling')).toBeFocused()
  })
})
