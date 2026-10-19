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
  test('MB-KEY-08: never switches menus from inside a nested submenu', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Submenu')

    await page.getByTestId('trigger-file').click()
    await page.getByTestId('file-share').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('file-share-email')).toBeFocused()

    // Left closes one submenu level (Menu-owned); the bar does not switch.
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('file-share-content')).toHaveCount(0)
    await expect(page.getByTestId('file-share')).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)

    // Right on a nested item without a submenu is a no-op for the bar too.
    await page.getByTestId('file-share').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('file-share-email')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('file-share-email')).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
  })
});
