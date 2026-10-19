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
  test('MB-OPEN-06: closes the whole bar and restores the trigger after selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await page.getByTestId('file-open').click()
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('menubar-action-display')).toHaveText('Last Action: File>Open')
    await expect(file).toBeFocused()
  })
});
