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
  test('MB-EVENT-01: consumer cancellation prevents pointer and native keyboard opening before value requests', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness', {
      cancelTrigger: true,
    })
    const file = page.getByTestId('contract-trigger-file')
    const requests = page.getByTestId('contract-requests')

    await file.click()
    await expect(page.getByTestId('contract-events')).toHaveText('file:click:null')
    await file.focus()
    for (const key of ['Enter', 'Space', 'ArrowDown', 'ArrowUp']) {
      await file.press(key)
      await expect(file).toBeFocused()
      await expect(file).toHaveAttribute('aria-expanded', 'false')
      await expect(page.getByRole('menu')).toHaveCount(0)
      await expect(requests).toHaveText('')
    }

    await fixture.update({ cancelTrigger: false })
    await file.press('ArrowDown')
    await expect(page.getByTestId('contract-file-first')).toBeFocused()
    await expect(requests).toHaveText('initial:file')
    await expect(page.getByTestId('contract-events')).toContainText('file:ArrowDown:null')
  })
});
