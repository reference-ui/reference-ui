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
  test('MB-KEY-07: opens a submenu parent on the open-direction arrow instead of switching', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Submenu')

    await page.getByTestId('trigger-file').click()
    await page.getByTestId('file-share').focus()
    await page.keyboard.press('ArrowRight')

    await expect(page.getByTestId('file-share-content')).toBeVisible()
    await expect(page.getByTestId('menubar-sub-logs')).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
  })
});
