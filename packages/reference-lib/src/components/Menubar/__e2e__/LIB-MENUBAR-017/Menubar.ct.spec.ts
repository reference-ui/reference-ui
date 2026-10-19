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
  test('MB-OPEN-02: toggles the open menu closed on trigger re-click', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await file.click()
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(file).toHaveAttribute('aria-expanded', 'false')
    await expect(file).toBeFocused()
  })
});
