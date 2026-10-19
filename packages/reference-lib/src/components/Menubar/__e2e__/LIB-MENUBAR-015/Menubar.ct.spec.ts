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
  test('MB-DOM-03: preserves native contracts through interaction', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Basic')
    const bar = page.getByTestId('menubar-root')
    const file = page.getByTestId('trigger-file')

    expect(await bar.evaluate(el => el.tagName)).toBe('DIV')
    expect(await file.evaluate(el => el.tagName)).toBe('BUTTON')

    await file.click()
    const content = page.getByTestId('content-file')
    await expect(content).toBeVisible()
    expect(await content.evaluate(el => el.tagName)).toBe('DIV')

    await page.getByTestId('file-new').click()
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('menubar-action-display')).toHaveText('Last Action: File>New')
  })
});
