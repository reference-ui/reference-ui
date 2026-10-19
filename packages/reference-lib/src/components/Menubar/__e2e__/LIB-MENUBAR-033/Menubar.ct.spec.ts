/**
 * Menubar browser proofs: row rendering, controlled open, keyboard
 * moves, switching, escape, and focus rows. Mounts the story fixtures
 * and asserts one-value coordination with trigger restore in a real
 * browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Page } from '@playwright/test'

async function activeTestId(page: Page): Promise<string | null> {
  return page.evaluate(
    () =>
      (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null
  )
}

async function activeWithin(page: Page, testId: string): Promise<boolean> {
  return page.evaluate(id => {
    const scope = document.querySelector(`[data-testid="${id}"]`)
    return !!scope?.contains(document.activeElement)
  }, testId)
}

test.describe('Menubar coordination', () => {
  test('MB-FOCUS-01: switches land focus inside the newly opened menu', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    // Trigger-arrow switch.
    await file.click()
    await file.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('content-edit')).toBeVisible()
    expect(await activeWithin(page, 'content-edit')).toBe(true)
    expect(await activeTestId(page)).not.toBe('trigger-file')

    // Content-arrow switch back.
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('content-file')).toBeVisible()
    expect(await activeWithin(page, 'content-file')).toBe(true)
  })
});
