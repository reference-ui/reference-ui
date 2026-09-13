import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Calendar CT', () => {
  test('renders calendar grid, selects date on click and updates state', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/SingleDate')

    const calendar = page.getByTestId('test-calendar')
    const display = page.getByTestId('calendar-value-display')
    const day20 = page.locator('button[data-date="2026-08-20"]')

    await expect(calendar).toBeVisible()
    await expect(display).toHaveText('Selected Date: 2026-08-15')
    await page.waitForTimeout(300)
    await snap(page, 'single-resting')

    // Hover unselected day
    await day20.hover()
    await page.waitForTimeout(200)
    await snap(page, 'single-hover')

    // Focus day
    await day20.focus()
    await page.waitForTimeout(200)
    await snap(page, 'single-focus')

    // Click August 20, 2026
    await day20.click()
    await expect(day20).toHaveAttribute('data-selected', '')
    await expect(display).toHaveText('Selected Date: 2026-08-20')
    await page.waitForTimeout(300)
    await snap(page, 'single-selected')

    // Navigate to next month
    const nextBtn = page.getByTestId('calendar-next')
    await nextBtn.click()
    await page.waitForTimeout(300)
    await snap(page, 'single-next-month')
  })

  test('renders date range and allows range selection', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/DateRange')

    const calendar = page.getByTestId('test-range-calendar')
    const display = page.getByTestId('range-value-display')

    await expect(calendar).toBeVisible()
    await expect(display).toHaveText('Range: 2026-08-10 to 2026-08-20')
    await page.waitForTimeout(300)
    await snap(page, 'range-resting')

    // Select new range: August 5 to August 12
    const day5 = page.locator('button[data-date="2026-08-05"]')
    const day12 = page.locator('button[data-date="2026-08-12"]')

    await day5.click()
    await day12.click()
    await expect(display).toHaveText('Range: 2026-08-05 to 2026-08-12')
    await page.waitForTimeout(300)
    await snap(page, 'range-selected')
  })
})
