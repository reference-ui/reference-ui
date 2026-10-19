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
  test('AC-SINGLE-06: consumer cancellation stops native pointer and keyboard clicks before collection requests', async ({ mount, page }) => {
    await mount<ContractProps>('components/Accordion/Accordion/ControlledContract', {
      value: null,
      cancelActivation: true,
    })
    const a = page.getByTestId('controlled-trigger-a')
    await a.click()
    await a.focus()
    await a.press('Space')
    await a.press('Enter')
    await expect(page.getByTestId('controlled-consumer-calls')).toHaveText('a,a,a')
    await expect(page.getByTestId('controlled-requests')).toHaveText('[]')
    await expect(a).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('controlled-content-a')).toHaveCount(0)
  })
})
