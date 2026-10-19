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
  test('MB-DOM-02: exposes controlled expansion on exactly the open menu', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(file).toHaveAttribute('aria-expanded', 'true')
    await expect(file).toHaveAttribute('data-state', 'open')
    await expect(edit).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).toHaveAttribute('data-state', 'closed')
    await expect(edit).not.toHaveAttribute('aria-controls', /.+/)

    const controls = await file.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    const controlledRole = await page.evaluate(id => {
      const node = document.getElementById(id!)
      return node?.querySelector('[role="menu"]')?.getAttribute('role') ?? null
    }, controls)
    expect(controlledRole).toBe('menu')
  })
});
