import { test, expect, snap } from '../../../../playwright/ct'

test.describe('DateField CT', () => {
  test('renders compound DateField, opens picker on trigger click, selects date and updates', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const input = page.getByTestId('date-field-input')
    const trigger = page.getByTestId('date-field-trigger')
    const picker = page.getByTestId('date-field-picker')
    const display = page.getByTestId('date-field-value-display')

    await expect(input).toHaveValue('2026-08-15')
    await expect(display).toHaveText('Date Value: 2026-08-15')
    await expect(picker).toHaveCount(0)
    await page.waitForTimeout(300)
    await snap(page, 'datefield-resting')

    // Hover trigger button
    await trigger.hover()
    await page.waitForTimeout(200)
    await snap(page, 'datefield-trigger-hover')

    // Click trigger -> opens picker
    await trigger.click()
    await expect(picker).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'datefield-picker-open')

    // Find and click August 25, 2026
    const day25 = page.locator('button[data-date="2026-08-25"]')
    await expect(day25).toBeVisible()
    await day25.hover()
    await page.waitForTimeout(200)
    await snap(page, 'datefield-day-hover')

    await day25.click()
    await expect(picker).toHaveCount(0)
    await expect(input).toHaveValue('2026-08-25')
    await expect(display).toHaveText('Date Value: 2026-08-25')
    await page.waitForTimeout(300)
    await snap(page, 'datefield-selected')
  })

  test('renders exactly one input and one trigger without duplicate synthesis', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const root = page.getByTestId('date-field-fixture-root')
    const inputs = root.locator('input:not([type="hidden"])')
    const buttons = root.locator('button')

    await expect(inputs).toHaveCount(1)
    await expect(buttons).toHaveCount(1)
  })

  test('opens picker via Alt+ArrowDown and deliberate input click', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const input = page.getByTestId('date-field-input')
    const picker = page.getByTestId('date-field-picker')

    await expect(picker).toHaveCount(0)

    // Alt + ArrowDown opens picker
    await input.focus()
    await page.waitForTimeout(200)
    await snap(page, 'datefield-input-focused')

    await page.keyboard.press('Alt+ArrowDown')
    await expect(picker).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'datefield-alt-down-open')

    // Escape closes picker
    await page.keyboard.press('Escape')
    await expect(picker).toHaveCount(0)
    await page.waitForTimeout(200)
    await snap(page, 'datefield-escaped')

    // Direct click on input opens picker
    await input.click()
    await expect(picker).toBeVisible()
  })
})
