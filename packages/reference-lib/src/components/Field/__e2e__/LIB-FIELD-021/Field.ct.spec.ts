/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-COMP-04: Field hosts a Combobox token picker without owning Combobox or chips', async ({
    mount,
    page,
  }) => {
    // Field-owned subset (label/input-embed/opener/chips/portal/invalid-bezel)
    // plus hosted commit/remove flows: Combobox owns the
    // semantics (CB-COMMIT/CB-SELECT proven), Field only hosts the bezel
    // around them. Focus-ring-on-opener assertions stay omitted: they need
    // the shared-theme focus propagation change (FI-CSS-06).
    await mount('components/Field/Field/TokenPickerFixture')

    const label = page.getByTestId('comp-people-label')
    const field = page.getByTestId('comp-people-field')
    const input = page.getByTestId('comp-people-input')
    const opener = page.getByTestId('comp-people-opener')
    const chipAlice = page.getByTestId('chip-Alice')
    const toggleInvBtn = page.getByTestId('btn-toggle-cb-invalid')

    await expect(input).toBeVisible()
    await page.waitForTimeout(300)

    // 1. Label htmlFor targets input id
    await expect(label).toHaveAttribute('for', 'people')
    await expect(input).toHaveAttribute('id', 'people')

    // 2. Field has no role
    await expect(field).not.toHaveAttribute('role')

    // 3. Input is embedded
    const inputBorder = await input.evaluate(el => window.getComputedStyle(el).borderWidth)
    expect(inputBorder).toBe('0px')

    // 4. Opener is button[type=button], not Combobox.Trigger
    await expect(opener).toHaveAttribute('type', 'button')
    await expect(opener).not.toHaveAttribute('data-reference-combobox-trigger')

    // 5. Chips are named native buttons
    await expect(chipAlice).toHaveAttribute('type', 'button')
    await expect(chipAlice).toHaveAttribute('aria-label', 'Remove Alice')

    await page.waitForTimeout(300)
    await snap(page, 'field-token-picker')

    // 6. Click opener: Input is focused, popover opens
    await opener.scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)
    await opener.click()
    await expect(page.locator('#people')).toBeFocused()
    const popover = page.getByTestId('comp-people-popover')
    await expect(popover).toBeVisible()

    // Popover is portalled, not a child of Field
    const isChildOfField = await field.evaluate(
      (f, p) => f.contains(p),
      await popover.elementHandle()
    )
    expect(isChildOfField).toBe(false)

    // 10. aria-invalid on Input drives bezel; chip button does not
    const defaultBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    await toggleInvBtn.click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await page.waitForTimeout(300)
    const invBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(invBorder).not.toBe(defaultBorder)

    // 11. Commit an option: one scalar Combobox onChange, application chips
    // update, Combobox renders no token nodes of its own.
    await page.keyboard.press('Escape')
    await expect(popover).toHaveCount(0)
    await opener.click()
    await expect(popover).toBeVisible()
    await page.getByTestId('option-bob').click()
    await expect(page.getByTestId('comp-people-changes')).toHaveText('Changes: 1')
    await expect(page.getByTestId('comp-people-last')).toHaveText('Last: "Bob"')
    const chipBob = page.getByTestId('chip-Bob')
    await expect(chipBob).toBeVisible()
    await expect(chipBob).toHaveAttribute('type', 'button')
    await expect(input).toHaveValue('')
    await expect(field.locator('[data-testid^="chip-"]')).toHaveCount(2)
    await expect(field.locator('[data-reference-combobox-token]')).toHaveCount(0)

    // 12. Remove a chip: application state updates, Combobox onChange silent.
    await chipAlice.click()
    await expect(page.getByTestId('chip-Alice')).toHaveCount(0)
    await expect(chipBob).toBeVisible()
    await expect(field.locator('[data-testid^="chip-"]')).toHaveCount(1)
    await expect(page.getByTestId('comp-people-changes')).toHaveText('Changes: 1')
  })
});
