/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-POINTER-04: Disabled Listbox options should remain inert across all input modalities while preserving authored props', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DisabledAuthored')
    await expect(page.getByTestId('da-root')).toBeVisible()

    const alpha = page.getByTestId('da-alpha')
    const bravo = page.getByTestId('da-bravo')
    const charlie = page.getByTestId('da-charlie')
    const calls = page.getByTestId('da-calls')
    const consumer = page.getByTestId('da-consumer')

    await expect(bravo).toHaveAttribute('data-consumer', 'kept')
    await expect(bravo).toHaveClass(/consumer-kept/)
    expect(await bravo.evaluate(el => (el as HTMLElement).style.borderWidth)).toBe('7px')

    await alpha.focus()
    await bravo.click({ force: true })
    await expect(alpha).toBeFocused()

    // Touch press sequence against the disabled option
    await bravo.evaluate(el => {
      const target = el as HTMLElement
      target.dispatchEvent(
        new PointerEvent('pointerdown', { pointerType: 'touch', button: 0, bubbles: true })
      )
      target.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }))
      target.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true }))
    })

    // Keyboard + typeahead attempts
    await page.keyboard.press('ArrowDown')
    await expect(charlie).toBeFocused()
    await page.keyboard.type('b')
    await expect(charlie).toBeFocused()
    await bravo.evaluate(el => (el as HTMLElement).focus())
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')

    await expect(consumer).toHaveText('[]')
    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')

    // Authored props survive every attempt
    await expect(bravo).toHaveAttribute('data-consumer', 'kept')
    await expect(bravo).toHaveClass(/consumer-kept/)
    expect(await bravo.evaluate(el => (el as HTMLElement).style.borderWidth)).toBe('7px')
  })
});
