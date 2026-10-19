/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-COMP-02 (range bezel): Field-surface hosts two range inputs in one bezel', async ({
    mount,
    page,
  }) => {
    // Range-share case: the Range bezel is itself the
    // Field-surface host (no nested Field), embedding both endpoints.
    await mount('components/Field/Field/RangeHostedFixture')

    const root = page.getByTestId('comp-range-wrapper')
    const bezel = root.locator('[data-reference-field]')
    const start = root.locator('input[data-reference-date-endpoint="start"]')
    const end = root.locator('input[data-reference-date-endpoint="end"]')
    const trigger = root.locator('button[data-reference-date-trigger]')

    await expect(bezel).toHaveCount(1)
    await expect(start).toBeVisible()
    await expect(end).toBeVisible()
    await expect(trigger).toBeVisible()

    // Both endpoint inputs are embedded in the one bezel.
    for (const endpoint of [start, end]) {
      const border = await endpoint.evaluate(el => window.getComputedStyle(el).borderWidth)
      expect(border).toBe('0px')
    }

    // Typing publishes through the shared bezel.
    await start.fill('2026-09-01')
    await expect(page.getByTestId('comp-range-val')).toHaveText(
      'Value: 2026-09-01..2026-09-15'
    )

    // The range Calendar stays portalled outside the bezel.
    await trigger.click()
    const picker = page.getByTestId('comp-range-picker')
    await expect(picker).toBeVisible()
    await expect(picker.locator('button[data-date="2026-09-20"]')).toBeVisible()
    const pickerInField = await bezel.evaluate(
      (b, p) => b.contains(p),
      await picker.elementHandle()
    )
    expect(pickerInField).toBe(false)
  })
});
