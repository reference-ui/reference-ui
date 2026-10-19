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
  test('MB-KEY-09: skips disabled menus in focus and switching', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Disabled')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')
    const help = page.getByTestId('trigger-help')

    await expect(help).toBeDisabled()
    await file.focus()
    await page.keyboard.press('ArrowRight')
    await expect(edit).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(file).toBeFocused()

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await page.getByTestId('file-new').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
    await expect(page.getByTestId('content-help')).toHaveCount(0)

    await help.click({ force: true })
    await expect(page.getByTestId('content-help')).toHaveCount(0)
  })
});
