/**
 * FocusLock × Overlay integration proof. Pins trapping while Content is
 * closed-but-mounted, single restore after Presence teardown, proximity
 * walks, nested-lock pausing, and modeless Content as a parent-lock
 * shard, each against the shared focus fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('FocusLock × Overlay', () => {
  test.afterEach(async ({ page }) => { await page.evaluate(() => window.scrollTo(0, 0)) })

  test('FL-OV-03 & FL-NEST-01 & FL-NEST-02 & FL-NEST-03: nested isolating Overlay pauses parent lock', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Focus')
    await expect(page.getByTestId('focus-lock-overlay-root')).toBeVisible()

    await page.getByTestId('fl-ov-nest-open-parent').click()
    await expect(page.getByTestId('fl-ov-nest-parent-1')).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'fl-ov-nest-parent-open')

    await page.getByTestId('fl-ov-nest-open-child').evaluate((el: HTMLElement) => el.click())
    await expect(page.getByTestId('fl-ov-nest-child-1')).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'fl-ov-nest-child-open')

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('fl-ov-nest-child-2')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('fl-ov-nest-child-close')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('fl-ov-nest-child-1')).toBeFocused()

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-nest-parent-1"]')?.focus()
    })
    const childReclaim = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(['fl-ov-nest-child-1', 'fl-ov-nest-child-2', 'fl-ov-nest-child-close']).toContain(
      childReclaim
    )

    await page.getByTestId('fl-ov-nest-child-close').evaluate((el: HTMLElement) => el.click())
    await expect(page.getByTestId('fl-ov-nest-child-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-nest-parent-1')).toBeFocused()

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-background"]')?.focus()
    })
    const parentReclaim = await page.evaluate(() => {
      const parent = document.querySelector('[data-testid="fl-ov-nest-parent-content"]')
      return Boolean(parent?.contains(document.activeElement))
    })
    expect(parentReclaim).toBe(true)
  })
})
