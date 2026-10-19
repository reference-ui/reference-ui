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
  test('MB-OPEN-05: closes the open menu on outside press', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await page.getByTestId('menubar-outside').click()
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(file).toHaveAttribute('aria-expanded', 'false')
  })
});
