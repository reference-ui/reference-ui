/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-COMP-02: Field hosts the DateField compound bezel without owning its state', async ({
    mount,
    page,
  }) => {
    // Field-owned bezel share plus the hosted typing/publish session
    // the session contract belongs to DateField, which has
    // proven it — Field only hosts the wrap/trigger/portal around it.
    await mount('components/Field/Field/DateCompoundFixture')

    const root = page.getByTestId('comp-datefield-wrapper')
    const input = page.getByTestId('comp-datefield-input')
    const trigger = page.getByTestId('comp-datefield-trigger')

    await expect(input).toBeVisible()
    await page.waitForTimeout(300)

    // Bezel wraps input and trigger
    const bezel = root.locator('[data-reference-field]')
    await expect(bezel).toBeVisible()
    await expect(bezel.locator(input)).toBeVisible()
    await expect(bezel.locator(trigger)).toBeVisible()

    // Trigger button carries its accessible name
    await expect(trigger).toHaveAttribute('aria-label', 'Open calendar')

    // The compound input is embedded in the shared bezel
    const inputBorder = await input.evaluate(el => window.getComputedStyle(el).borderWidth)
    expect(inputBorder).toBe('0px')

    // Value publishing surfaces without Field state
    await expect(page.getByTestId('comp-datefield-val')).toHaveText('Value: 2026-09-10')

    await page.waitForTimeout(300)
    await snap(page, 'field-date-compound')

    // Hosted typing session: ISO interchange publishes through the bezel.
    await input.fill('2026-10-15')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('comp-datefield-val')).toHaveText('Value: 2026-10-15')
    await expect(bezel.locator(input)).toBeVisible()
    await expect(bezel.locator(trigger)).toBeVisible()

    // The Calendar stays inside the portalled picker layer, never a Field
    // descendant.
    await trigger.click()
    const picker = page.getByTestId('comp-datefield-picker')
    await expect(picker).toBeVisible()
    await expect(picker.locator('button[data-date="2026-10-20"]')).toBeVisible()
    const pickerInField = await bezel.evaluate(
      (b, p) => b.contains(p),
      await picker.elementHandle()
    )
    expect(pickerInField).toBe(false)
  })
});
