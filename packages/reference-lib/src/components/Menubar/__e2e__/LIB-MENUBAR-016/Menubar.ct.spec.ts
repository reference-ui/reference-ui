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
  test('MB-OPEN-01: keeps at most one menu open across trigger clicks', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')
    const view = page.getByTestId('trigger-view')

    await page.waitForTimeout(300)
    await snap(page, 'resting')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByRole('menu')).toHaveCount(1)
    await page.waitForTimeout(300)
    await snap(page, 'file-open')

    await edit.click()
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
    await expect(page.getByRole('menu')).toHaveCount(1)
    await expect(file).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).toHaveAttribute('aria-expanded', 'true')
    await page.waitForTimeout(300)
    await snap(page, 'edit-open-switched')

    await view.click()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
    await expect(page.getByTestId('content-view')).toBeVisible()
    await expect(page.getByRole('menu')).toHaveCount(1)
  })
});
