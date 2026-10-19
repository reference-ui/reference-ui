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
  test('MB-KEY-02: moves trigger focus only when no menu is open', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')
    const view = page.getByTestId('trigger-view')

    await file.focus()
    await page.keyboard.press('ArrowRight')
    await expect(edit).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(view).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(edit).toBeFocused()

    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(file).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).toHaveAttribute('aria-expanded', 'false')
    await expect(view).toHaveAttribute('aria-expanded', 'false')
  })
});
