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
  test('MB-CTRL-01: programmatic values update mounted relationships silently and do not inherit stale entry intent', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness', {
      heldValue: 'file',
    })
    const file = page.getByTestId('contract-trigger-file')
    const edit = page.getByTestId('contract-trigger-edit')
    const original = await file.elementHandle()
    const requests = page.getByTestId('contract-requests')

    await expect(page.getByTestId('contract-content-file')).toBeVisible()
    const fileControls = await file.getAttribute('aria-controls')
    expect(fileControls).toBeTruthy()
    await file.focus()
    await file.press('ArrowUp')
    await expect(requests).toHaveText('')

    await fixture.update({ heldValue: 'edit' })
    await expect(page.getByTestId('contract-content-file')).toHaveCount(0)
    await expect(page.getByTestId('contract-content-edit')).toBeVisible()
    await expect(file).not.toHaveAttribute('aria-controls', /.+/)
    await expect(edit).toHaveAttribute('aria-expanded', 'true')
    const editControls = await edit.getAttribute('aria-controls')
    expect(editControls).toBeTruthy()
    expect(editControls).not.toBe(fileControls)
    await expect(page.locator(`[id="${editControls}"]`).getByRole('menu')).toHaveCount(1)
    await expect(page.getByTestId('contract-edit-last')).not.toBeFocused()
    await expect.poll(() => page.getByTestId('contract-content-edit').evaluate(element => element.contains(document.activeElement))).toBe(true)
    await expect(requests).toHaveText('')

    await fixture.update({ heldValue: null })
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(edit).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).not.toHaveAttribute('aria-controls', /.+/)
    expect(await file.evaluate((element, node) => element === node, original)).toBe(true)
    await expect(requests).toHaveText('')

    await fixture.update({ heldValue: 'file' })
    await expect(page.getByTestId('contract-content-file')).toBeVisible()
    await expect(file).toHaveAttribute('aria-controls', fileControls!)
    await expect(requests).toHaveText('')
  })
});
