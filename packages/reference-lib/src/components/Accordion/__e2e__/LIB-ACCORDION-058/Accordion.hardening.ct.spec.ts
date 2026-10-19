/**
 * Accordion controlled-policy hardening in the browser. Rejected,
 * programmatic, consumer-cancelled, and reordered single/multiple
 * requests must leave disclosure visibility and linkage authoritative
 * without remounting surviving triggers.
 */
import { test, expect } from '../../../../../playwright/ct'
import type { ComponentProps } from 'react'
import type { ControlledContract } from '../../Accordion.story'

type ContractProps = ComponentProps<typeof ControlledContract>

test.describe('Accordion controlled policy in the browser', () => {
  test('AC-MULTI-05: rejected array requests keep every disclosure authoritative across native modalities', async ({ mount, page }) => {
    await mount<ContractProps>('components/Accordion/Accordion/ControlledContract', {
      expansion: 'multiple',
      value: ['a'],
    })
    const a = page.getByTestId('controlled-trigger-a')
    const b = page.getByTestId('controlled-trigger-b')
    await b.click()
    await a.focus()
    await a.press('Space')
    await b.focus()
    await b.press('Enter')
    await expect(page.getByTestId('controlled-requests')).toHaveText('[["a","b"],[],["a","b"]]')
    await expect(a).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('controlled-content-a')).toBeVisible()
    await expect(b).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('controlled-content-b')).toHaveCount(0)
  })
})
