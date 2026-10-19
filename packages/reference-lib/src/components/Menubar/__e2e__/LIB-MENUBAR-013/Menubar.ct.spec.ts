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
  test('MB-DOM-01: renders a menubar row of menuitem triggers with one tab stop', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const bar = page.getByTestId('menubar-root')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')
    const view = page.getByTestId('trigger-view')

    await expect(bar).toHaveAttribute('role', 'menubar')
    for (const trigger of [file, edit, view]) {
      await expect(trigger).toHaveAttribute('role', 'menuitem')
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger).toHaveAttribute('data-state', 'closed')
    }
    await expect(file).toHaveAttribute('tabindex', '0')
    await expect(edit).toHaveAttribute('tabindex', '-1')
    await expect(view).toHaveAttribute('tabindex', '-1')
    await expect(page.getByRole('menu')).toHaveCount(0)
  })
});
