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
  test('MB-KEY-05: loop wraps trigger focus and switching', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Loop')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')

    await edit.focus()
    await page.keyboard.press('ArrowRight')
    await expect(file).toBeFocused()

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await file.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
  })
});
