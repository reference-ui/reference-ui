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
  test('AC-MULTI-04: reordered multiple requests deduplicate known values and retain absent controlled identities', async ({ mount, page }) => {
    const value = ['ghost-2', 'c', 'a', 'c', 'ghost-1']
    const fixture = await mount<ContractProps>('components/Accordion/Accordion/ControlledContract', {
      expansion: 'multiple',
      value,
    })
    const a = page.getByTestId('controlled-trigger-a')
    const original = await a.elementHandle()
    await fixture.update({ expansion: 'multiple', value, items: ['c', 'b', 'a'] })
    await page.getByTestId('controlled-trigger-b').click()
    await expect(page.getByTestId('controlled-requests')).toHaveText('[["c","b","a","ghost-2","ghost-1"]]')
    await expect(page.getByTestId('controlled-trigger-b')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('controlled-content-b')).toHaveCount(0)
    await expect(a).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('controlled-trigger-c')).toHaveAttribute('aria-expanded', 'true')

    await fixture.update({ expansion: 'multiple', value: ['c', 'b', 'a', 'ghost-2', 'ghost-1'], items: ['c', 'b', 'a'] })
    for (const id of ['a', 'b', 'c']) {
      await expect(page.getByTestId(`controlled-trigger-${id}`)).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByTestId(`controlled-content-${id}`)).toBeVisible()
    }
    expect(await a.evaluate((element, node) => element === node, original)).toBe(true)
    await expect(page.getByTestId('controlled-requests')).toHaveText('[["c","b","a","ghost-2","ghost-1"]]')
  })
})
