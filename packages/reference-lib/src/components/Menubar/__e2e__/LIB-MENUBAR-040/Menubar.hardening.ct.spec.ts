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
  test('MB-DYNAMIC-02: mounted direction and callback updates apply to the next switch without stale emissions', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness')
    const file = page.getByTestId('contract-trigger-file')
    const original = await file.elementHandle()
    await file.focus()
    await file.press('ArrowDown')
    await expect(page.getByTestId('contract-file-first')).toBeFocused()

    await fixture.update({ dir: 'rtl', handlerVersion: 'current' })
    await file.focus()
    await file.press('ArrowLeft')
    await expect(page.getByTestId('contract-content-edit')).toBeVisible()
    await expect(page.getByTestId('contract-requests')).toHaveText('initial:file,current:edit')
    await page.getByTestId('contract-edit-first').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('contract-content-file')).toBeVisible()
    await expect(page.getByTestId('contract-requests')).toHaveText('initial:file,current:edit,current:file')
    expect(await file.evaluate((element, node) => element === node, original)).toBe(true)
    await expect(file).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('contract-trigger-edit')).toHaveAttribute('aria-expanded', 'false')
  })
});
