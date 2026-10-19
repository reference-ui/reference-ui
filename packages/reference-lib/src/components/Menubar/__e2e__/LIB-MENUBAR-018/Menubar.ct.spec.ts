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
  test('MB-OPEN-03: stays visibly controlled when value updates are rejected', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Controlled')
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('menubar-value-display')).toHaveText('Value: file')

    // Toggle via keyboard: a pointer click is an outside press and would
    // dismiss File before the probe.
    const toggle = page.getByTestId('btn-toggle-reject')
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menubar-reject-display')).toHaveText('Reject: On')
    await expect(page.getByTestId('content-file')).toBeVisible()

    // Pointer down outside File requests close (null), the Edit trigger
    // requests open (edit); the parent rejects both, so File stays open.
    await page.getByTestId('trigger-edit').click()
    await expect(page.getByTestId('menubar-value-logs')).toHaveText(
      'Logs: request:null,request:edit'
    )
    await expect(page.getByTestId('menubar-value-display')).toHaveText('Value: file')
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)

    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menubar-reject-display')).toHaveText('Reject: Off')
    await page.getByTestId('trigger-edit').click()
    await expect(page.getByTestId('menubar-value-display')).toHaveText('Value: edit')
    await expect(page.getByTestId('content-edit')).toBeVisible()
  })
});
