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
  test('MB-A11Y-01: keeps expansion and control relationships correct in every state', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')

    await expect(page.getByTestId('menubar-root')).toHaveAttribute('role', 'menubar')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    let controls = await file.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    await expect(edit).not.toHaveAttribute('aria-controls', /.+/)

    await edit.click()
    await expect(page.getByTestId('content-edit')).toBeVisible()
    await expect(file).not.toHaveAttribute('aria-controls', /.+/)
    controls = await edit.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    const resolvesToMenu = await page.evaluate(id => {
      const node = document.getElementById(id!)
      return node?.querySelector(':scope [role="menu"]') !== null
    }, controls)
    expect(resolvesToMenu).toBe(true)

    // Scanner half: open state first (edit content mounted with its
    // menu), then the closed state. Whole-page scope: menu content
    // portals to document.body, so #root-scoping would miss
    // component-owned content; the gallery holds one story per mount.
    await expectNoAxeViolations(page)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
    await expect(edit).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).not.toHaveAttribute('aria-controls', /.+/)
    await expectNoAxeViolations(page)
  })
});
