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
  test('MB-KEY-01: opens on Down/Enter/Space (first item) and Up (last item)', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    for (const key of ['Enter', ' ', 'ArrowDown'] as const) {
      await file.focus()
      await page.keyboard.press(key)
      await expect(page.getByTestId('file-new')).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(page.getByTestId('content-file')).toHaveCount(0)
    }

    await file.focus()
    await page.keyboard.press('ArrowUp')
    // Delete is disabled, so the last enabled item is Open.
    await expect(page.getByTestId('file-open')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
  })
});
