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

  test('renders leap February with Thursday-aligned start (kernel grid)', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/LeapFebruary')

    await expect(page.getByTestId('leap-heading')).toContainText('February 2024')
    await expect(page.locator('button[data-date]')).toHaveCount(29)
    await expect(page.locator('button[data-date="2024-02-01"]')).toBeVisible()
    await expect(page.locator('button[data-date="2024-02-29"]')).toBeVisible()

    // Feb 1 2024 was a Thursday: 4 empty cells precede it in the Sunday-first grid.
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow.locator('td')).toHaveCount(7)
    await expect(firstRow.locator('td').nth(4).locator('button')).toHaveAttribute(
      'data-date',
      '2024-02-01'
    )
  })

  test('navigates across the year boundary from a today-seeded pane', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/DecemberNav')

    const heading = page.getByTestId('dec-heading')
    await expect(heading).toContainText('December 2026')

    await page.getByTestId('dec-next').click()
    await expect(heading).toContainText('January 2027')

    await page.getByTestId('dec-prev').click()
    await page.getByTestId('dec-prev').click()
    await expect(heading).toContainText('November 2026')
  })
})
