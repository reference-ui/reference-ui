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
  test('MB-EVENT-02: consumer cancellation prevents closed roving and open trigger or content switching', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness', {
      cancelTrigger: true,
    })
    const file = page.getByTestId('contract-trigger-file')
    const requests = page.getByTestId('contract-requests')

    await file.focus()
    for (const key of ['ArrowRight', 'End']) {
      await file.press(key)
      await expect(file).toBeFocused()
      await expect(requests).toHaveText('')
    }

    await fixture.update({ cancelTrigger: false })
    await file.press('ArrowDown')
    await expect(page.getByTestId('contract-file-first')).toBeFocused()
    await fixture.update({ cancelTrigger: true, cancelContent: true })
    await file.focus()
    await file.press('ArrowRight')
    await expect(file).toBeFocused()
    await expect(page.getByTestId('contract-content-file')).toBeVisible()

    const first = page.getByTestId('contract-file-first')
    await first.focus()
    await first.press('ArrowRight')
    await expect(first).toBeFocused()
    await expect(requests).toHaveText('initial:file')
    await expect(page.getByTestId('contract-content-edit')).toHaveCount(0)

    await fixture.update({ cancelTrigger: false, cancelContent: false })
    await first.press('ArrowRight')
    await expect(page.getByTestId('contract-content-edit')).toBeVisible()
    await expect(requests).toHaveText('initial:file,initial:edit')
  })
});
