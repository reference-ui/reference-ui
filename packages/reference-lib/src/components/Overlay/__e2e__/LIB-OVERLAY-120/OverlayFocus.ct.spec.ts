/**
 * FocusLock × Overlay integration proof. Pins trapping while Content is
 * closed-but-mounted, single restore after Presence teardown, proximity
 * walks, nested-lock pausing, and modeless Content as a parent-lock
 * shard, each against the shared focus fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('FocusLock × Overlay', () => {
  test.afterEach(async ({ page }) => { await page.evaluate(() => window.scrollTo(0, 0)) })

  test('FL-OV-04 & FL-NEST-05 & FL-SHARD-03: modeless Overlay.Content is a shard of the parent lock', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Focus')
    await expect(page.getByTestId('focus-lock-overlay-root')).toBeVisible()

    await page.getByTestId('fl-ov-shard-open-parent').click()
    await expect(page.getByTestId('fl-ov-shard-parent-1')).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'fl-ov-shard-parent-open')

    await page.getByTestId('fl-ov-shard-open-child').evaluate((el: HTMLElement) => el.click())
    const child = page.getByTestId('fl-ov-shard-child-content')
    await expect(child).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'fl-ov-shard-child-open')

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-shard-child-1"]')?.focus()
    })
    await expect(page.getByTestId('fl-ov-shard-child-1')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('fl-ov-shard-child-2')).toBeFocused()

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-shard-unregistered"]')?.focus()
    })
    const afterEscape = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(afterEscape).not.toBe('fl-ov-shard-unregistered')
    expect(afterEscape).not.toBe('fl-ov-background')

    await page.getByTestId('fl-ov-shard-child-close').evaluate((el: HTMLElement) => el.click())
    await expect(child).toHaveCount(0)
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const parent = document.querySelector('[data-testid="fl-ov-shard-parent-content"]')
        return Boolean(parent?.contains(document.activeElement))
      })
    }).toBe(true)

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-shard-unregistered"]')?.focus()
    })
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const parent = document.querySelector('[data-testid="fl-ov-shard-parent-content"]')
        return Boolean(parent?.contains(document.activeElement))
      })
    }).toBe(true)
  })
})
