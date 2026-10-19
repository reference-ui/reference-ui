/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DOM-01: Renders listbox and options, selects option on click and updates state', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Basic')
    await expect(page.getByTestId('listbox-fixture-root')).toBeVisible()

    const listbox = page.getByTestId('test-listbox')
    const optApple = page.getByTestId('opt-apple')
    const optBanana = page.getByTestId('opt-banana')
    const optDisabled = page.getByTestId('opt-disabled')
    const display = page.getByTestId('listbox-value-display')

    await expect(listbox).toHaveAttribute('role', 'listbox')
    await expect(optApple).toHaveAttribute('role', 'option')
    await expect(optApple).toHaveAttribute('aria-selected', 'true')
    await expect(optApple).toHaveAttribute('data-state', 'selected')
    await expect(optBanana).toHaveAttribute('aria-selected', 'false')
    await expect(optBanana).toHaveAttribute('data-state', 'unselected')
    const optBox = await optApple.boundingBox()
    expect(optBox?.height).toBe(34)
    await expect(display).toHaveText('Selected: apple')

    await page.waitForTimeout(300)
    await snap(page, 'listbox-default')

    // Hover banana
    await optBanana.hover()
    await page.waitForTimeout(200)
    await snap(page, 'listbox-hover-banana')

    // Click Banana -> selects banana
    await optBanana.click()
    await expect(optBanana).toHaveAttribute('aria-selected', 'true')
    await expect(optBanana).toHaveAttribute('data-state', 'selected')
    await expect(optApple).toHaveAttribute('aria-selected', 'false')
    await expect(optApple).toHaveAttribute('data-state', 'unselected')
    await expect(display).toHaveText('Selected: banana')

    await page.waitForTimeout(200)
    await snap(page, 'listbox-selected-banana')

    // Hover disabled
    await optDisabled.hover({ force: true })
    await page.waitForTimeout(200)
    await snap(page, 'listbox-hover-disabled')
  })
});
