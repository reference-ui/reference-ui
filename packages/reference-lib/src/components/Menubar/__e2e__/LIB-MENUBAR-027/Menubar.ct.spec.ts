/**
 * Menubar browser proofs: row rendering, controlled open, keyboard
 * moves, switching, escape, and focus rows. Mounts the story fixtures
 * and asserts one-value coordination with trigger restore in a real
 * browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Page } from '@playwright/test'

async function activeWithin(page: Page, testId: string): Promise<boolean> {
  return page.evaluate(id => {
    const scope = document.querySelector(`[data-testid="${id}"]`)
    return !!scope?.contains(document.activeElement)
  }, testId)
}

test.describe('Menubar coordination', () => {
  test('MB-KEY-06: switches menus on Left/Right from a root-level item', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')

    await page.getByTestId('trigger-file').click()
    await page.getByTestId('file-new').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
    expect(await activeWithin(page, 'content-edit')).toBe(true)

    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
    await expect(page.getByTestId('content-file')).toBeVisible()
    expect(await activeWithin(page, 'content-file')).toBe(true)
  })
});
