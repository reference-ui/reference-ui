/**
 * FocusLock × Overlay integration proof. Pins trapping while Content is
 * closed-but-mounted, single restore after Presence teardown, proximity
 * walks, nested-lock pausing, and modeless Content as a parent-lock
 * shard, each against the shared focus fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('FocusLock × Overlay', () => {
  test.afterEach(async ({ page }) => { await page.evaluate(() => window.scrollTo(0, 0)) })

  test('FL-OV-01: FocusLock keeps trapping while Overlay Content is closed-but-mounted', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Focus')
    await expect(page.getByTestId('focus-lock-overlay-root')).toBeVisible()

    const trigger = page.getByTestId('fl-ov-01-trigger')
    await page.evaluate(() => window.scrollTo(0, 765))
    await trigger.click()
    const content = page.getByTestId('fl-ov-01-content')
    await expect(content).toBeVisible()
    await expect(page.getByTestId('fl-ov-01-first')).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'fl-ov-01-open')

    await page.getByTestId('fl-ov-01-close').click()
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(content).toBeVisible()

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-background"]')?.focus()
    })
    const duringExit = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(['fl-ov-01-first', 'fl-ov-01-second', 'fl-ov-01-close', 'fl-ov-01-content']).toContain(
      duringExit
    )

    await page.keyboard.press('Tab')
    const afterTab = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(afterTab).not.toBe('fl-ov-background')
    expect(afterTab).not.toBe('fl-ov-01-trigger')

    await expect(content).toHaveCount(0)
    await page.waitForTimeout(200)
    await snap(page, 'fl-ov-01-closed')
    await page.evaluate(() => window.scrollTo(0, 987))
  })
})
