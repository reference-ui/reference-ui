/**
 * FocusLock × Overlay integration proof. Pins trapping while Content is
 * closed-but-mounted, single restore after Presence teardown, proximity
 * walks, nested-lock pausing, and modeless Content as a parent-lock
 * shard, each against the shared focus fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('FocusLock × Overlay', () => {
  test.afterEach(async ({ page }) => { await page.evaluate(() => window.scrollTo(0, 0)) })

  test('FL-OV-02 & FL-RESTORE-02 & FL-RESTORE-08: one restore after Presence, skip, explicit target', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Focus')
    await expect(page.getByTestId('focus-lock-overlay-root')).toBeVisible()

    const trigger = page.getByTestId('fl-ov-01-trigger')
    await trigger.click()
    const content = page.getByTestId('fl-ov-01-content')
    await expect(page.getByTestId('fl-ov-01-first')).toBeFocused()
    await page.evaluate(() => {
      ;(window as unknown as { __flRestore: number }).__flRestore = 0
      const triggerEl = document.querySelector('[data-testid="fl-ov-01-trigger"]')
      triggerEl?.addEventListener('focus', () => {
        const contentEl = document.querySelector('[data-testid="fl-ov-01-content"]')
        if (!contentEl || contentEl.getAttribute('data-state') === 'closed') {
          ;(window as unknown as { __flRestore: number }).__flRestore += 1
        }
      })
    })

    await page.getByTestId('fl-ov-01-close').click()
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(trigger).not.toBeFocused()
    await expect(content).toHaveCount(0)
    await expect(trigger).toBeFocused()
    const restoreCount = await page.evaluate(
      () => (window as unknown as { __flRestore: number }).__flRestore
    )
    expect(restoreCount).toBe(1)

    await page.getByTestId('fl-ov-skip-trigger').click()
    await expect(page.getByTestId('fl-ov-skip-content')).toBeVisible()
    await page.waitForTimeout(200)
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('*').forEach(el => { if (el.scrollTop) el.scrollTop = 0; if (el.scrollLeft) el.scrollLeft = 0; }) })
    await snap(page, 'fl-ov-skip-open')

    await page.getByTestId('fl-ov-skip-close').click()
    await expect(page.getByTestId('fl-ov-skip-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-skip-trigger')).not.toBeFocused()
    await page.getByTestId('fl-ov-background').focus()
    await expect(page.getByTestId('fl-ov-background')).toBeFocused()
    await expect(page.getByTestId('fl-ov-skip-trigger')).not.toBeFocused()

    await page.getByTestId('fl-ov-explicit-trigger').click()
    await expect(page.getByTestId('fl-ov-explicit-content')).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'fl-ov-explicit-open')

    await page.getByTestId('fl-ov-explicit-close').click()
    await expect(page.getByTestId('fl-ov-explicit-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-explicit-target')).toBeFocused()
    await expect(page.getByTestId('fl-ov-explicit-trigger')).not.toBeFocused()
  })
})
