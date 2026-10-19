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
  test('AC-SINGLE-03: rejected native opening and closing preserve expansion visibility and linkage', async ({ mount, page }) => {
    await mount<ContractProps>('components/Accordion/Accordion/ControlledContract', { value: 'a' })
    const a = page.getByTestId('controlled-trigger-a')
    const b = page.getByTestId('controlled-trigger-b')
    const content = page.getByTestId('controlled-content-a')
    const controls = await a.getAttribute('aria-controls')
    expect(controls).toBeTruthy()

    await b.click()
    await expect(page.getByTestId('controlled-requests')).toHaveText('["b"]')
    await expect(a).toHaveAttribute('aria-expanded', 'true')
    await expect(b).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toBeVisible()
    await expect(page.getByTestId('controlled-content-b')).toHaveCount(0)

    await a.focus()
    await a.press('Space')
    await expect(page.getByTestId('controlled-requests')).toHaveText('["b",null]')
    await a.press('Enter')
    await expect(page.getByTestId('controlled-requests')).toHaveText('["b",null,null]')
    await expect(a).toHaveAttribute('aria-expanded', 'true')
    await expect(a).toHaveAttribute('data-state', 'open')
    await expect(a).toHaveAttribute('aria-controls', controls!)
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(content).toBeVisible()
    await expect(content).not.toHaveAttribute('aria-hidden', 'true')
    await expect(content).not.toHaveAttribute('inert')
    await expect(a).toBeFocused()
  })
})
