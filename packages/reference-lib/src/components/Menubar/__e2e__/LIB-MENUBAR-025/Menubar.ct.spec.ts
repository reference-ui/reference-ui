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
  test('MB-KEY-05: clamps trigger arrows at the edges unless loop is set', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const view = page.getByTestId('trigger-view')

    await file.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(file).toBeFocused()
    await view.focus()
    await page.keyboard.press('ArrowRight')
    await expect(view).toBeFocused()
    await expect(page.getByRole('menu')).toHaveCount(0)

    // Open bars clamp the switch too: no wrap, no value change.
    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await file.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(file).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-view')).toHaveCount(0)
  })
});
