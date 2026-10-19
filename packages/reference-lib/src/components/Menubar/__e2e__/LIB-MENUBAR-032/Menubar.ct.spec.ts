/**
 * Menubar browser proofs: row rendering, controlled open, keyboard
 * moves, switching, escape, and focus rows. Mounts the story fixtures
 * and asserts one-value coordination with trigger restore in a real
 * browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Page } from '@playwright/test'

test.describe('Menubar coordination', () => {
  test('MB-ESC-02: closes one submenu level per Escape with trigger restore', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Submenu')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await page.getByTestId('file-share').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('file-share-email')).toBeFocused()
    await page.waitForTimeout(300)
    await snap(page, 'submenu-open')

    // First Escape: only Share closes; File stays open; focus to Share trigger.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('file-share-content')).toHaveCount(0)
    await expect(page.getByTestId('file-share')).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('menubar-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,share:onDismiss'
    )

    // Second Escape: File closes; focus to the File menubar trigger.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(file).toBeFocused()
  })
});
