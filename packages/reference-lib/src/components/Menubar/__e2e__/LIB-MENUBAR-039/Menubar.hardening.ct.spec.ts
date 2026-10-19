/**
 * Menubar consumer and lifecycle contracts in the browser. Cancellation
 * ordering, silent programmatic updates, and live registry dynamics
 * must hold without stale emissions or inherited intent.
 */
import { test, expect } from '../../../../../playwright/ct'
import type { ComponentProps } from 'react'
import type { ContractHarness } from '../../Menubar.story'

type ContractProps = ComponentProps<typeof ContractHarness>

test.describe('Menubar consumer and lifecycle contracts', () => {
  test('MB-DYNAMIC-01: live menu reorder insertion removal and disabling drive one current navigation registry', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness')
    const file = page.getByTestId('contract-trigger-file')
    const original = await file.elementHandle()
    const requests = page.getByTestId('contract-requests')

    await fixture.update({ menus: ['file', 'view', 'edit'] })
    await file.focus()
    await file.press('ArrowRight')
    await expect(page.getByTestId('contract-trigger-view')).toBeFocused()
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(requests).toHaveText('')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('contract-view-first')).toBeFocused()

    await fixture.update({ menus: ['view', 'help', 'file', 'edit'] })
    await page.getByTestId('contract-view-first').press('ArrowRight')
    await expect(page.getByTestId('contract-content-help')).toBeVisible()
    await expect(requests).toHaveText('initial:view,initial:help')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)

    await fixture.update({ menus: ['view', 'file', 'edit'], disabledMenus: ['file'] })
    await page.getByTestId('contract-trigger-view').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('contract-trigger-edit')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('contract-edit-first')).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('contract-content-view')).toBeVisible()
    await expect(page.getByTestId('contract-content-help')).toHaveCount(0)
    await expect(page.getByTestId('contract-content-file')).toHaveCount(0)
    await expect(page.getByTestId('contract-bar').locator('[tabindex="0"]')).toHaveCount(1)
    expect(await file.evaluate((element, node) => element === node, original)).toBe(true)
    await expect(requests).toHaveText('initial:view,initial:help,initial:null,initial:edit,initial:view')
  })
});
