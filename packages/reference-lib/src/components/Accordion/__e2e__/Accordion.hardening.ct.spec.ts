/**
 * Accordion controlled-policy hardening in the browser. Rejected,
 * programmatic, consumer-cancelled, and reordered single/multiple
 * requests must leave disclosure visibility and linkage authoritative
 * without remounting surviving triggers.
 */
import { test, expect } from '../../../../playwright/ct'
import type { ComponentProps } from 'react'
import type { ControlledContract } from '../Accordion.story'

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
