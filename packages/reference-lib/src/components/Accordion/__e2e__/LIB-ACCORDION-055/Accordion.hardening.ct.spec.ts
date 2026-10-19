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
  test('AC-SINGLE-04: programmatic single values update disclosure relationships without requests or trigger replacement', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Accordion/Accordion/ControlledContract', { value: 'a' })
    const a = page.getByTestId('controlled-trigger-a')
    const b = page.getByTestId('controlled-trigger-b')
    const original = await a.elementHandle()
    const originalControls = await a.getAttribute('aria-controls')

    await fixture.update({ value: 'b' })
    await expect(a).toHaveAttribute('aria-expanded', 'false')
    await expect(b).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('controlled-content-a')).toHaveCount(0)
    await expect(a).not.toHaveAttribute('aria-controls', /.+/)
    const bControls = await b.getAttribute('aria-controls')
    expect(bControls).toBeTruthy()
    await expect(page.locator(`[id="${bControls}"]`)).toHaveAttribute('data-state', 'open')

    await fixture.update({ value: null })
    await expect(page.getByTestId('controlled-content-b')).toHaveCount(0)
    await expect(b).toHaveAttribute('aria-expanded', 'false')
    await expect(b).not.toHaveAttribute('aria-controls', /.+/)
    await fixture.update({ value: 'a' })
    await expect(page.getByTestId('controlled-content-a')).toBeVisible()
    await expect(a).toHaveAttribute('aria-controls', originalControls!)
    expect(await a.evaluate((element, node) => element === node, original)).toBe(true)
    await expect(page.getByTestId('controlled-requests')).toHaveText('[]')
  })
})
