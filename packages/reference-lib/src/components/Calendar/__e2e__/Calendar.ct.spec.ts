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

  test('CA-STATE-03: selected date keeps the sole day tab stop', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/SingleDate')

    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2026-08-15"]')).toHaveAttribute('tabindex', '0')
  })

  test('CA-STATE-03: selection-less pane tabs into today without stealing focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DecemberNav')

    const targets = page.locator('button[data-date][tabindex="0"]')
    await expect(targets).toHaveCount(1)
    await expect(targets).toHaveAttribute('data-date', '2026-12-15')
    // No automatic focus steal on mount.
    await expect(page.locator('button[data-date="2026-12-15"]')).not.toBeFocused()

    // Native Tab from the last header control enters the grid at today.
    await page.getByTestId('dec-next').focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('button[data-date="2026-12-15"]')).toBeFocused()
  })

  test('CA-STATE-03: selection-less pane with today elsewhere tabs into the first of the month', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/NoSelectionTodayElsewhere')

    const targets = page.locator('button[data-date][tabindex="0"]')
    await expect(targets).toHaveCount(1)
    await expect(targets).toHaveAttribute('data-date', '2024-02-01')

    await page.getByTestId('elsewhere-next').focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('button[data-date="2024-02-01"]')).toBeFocused()
  })

  test('CA-SINGLE-01/02/05 uniform-request: every activation requests its ISO once; rejection leaves selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/EmissionCounter')

    const log = page.getByTestId('emit-log')
    const day10 = page.locator('button[data-date="2024-04-10"]')
    const day12 = page.locator('button[data-date="2024-04-12"]')

    await expect(log).toHaveText('none')

    await day10.click()
    await expect(log).toHaveText('2024-04-10')
    await expect(day10).toHaveAttribute('data-selected', '')

    // Re-activating the selected date re-requests it (uniform-request;
    // triage overrides the old CA-SINGLE-03 no-emit read).
    await day10.click()
    await expect(log).toHaveText('2024-04-10,2024-04-10')

    // Parent rejection: the request logs but selection stays put.
    await page.getByTestId('emit-toggle-accept').click()
    await day12.click()
    await expect(log).toHaveText('2024-04-10,2024-04-10,2024-04-12')
    await expect(day10).toHaveAttribute('data-selected', '')
    await expect(day12).not.toHaveAttribute('data-selected', '')
  })

  test('CA-MONTH-02/05: controlled nav requests the adjacent month once with no optimistic render', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/MonthMachine')

    const heading = page.getByTestId('month-heading')
    const requests = page.getByTestId('month-requests')

    await expect(heading).toContainText('January 2024')
    await expect(requests).toHaveText('none')

    await page.getByTestId('month-next').click()
    await expect(requests).toHaveText('2024-02')
    await expect(heading).toContainText('January 2024')

    // A second gesture re-requests the same adjacent target; still January.
    await page.getByTestId('month-next').click()
    await expect(requests).toHaveText('2024-02,2024-02')
    await expect(heading).toContainText('January 2024')

    await page.getByTestId('month-accept').click()
    await expect(heading).toContainText('February 2024')
    await expect(requests).toHaveText('none')
  })

  test('CA-MONTH-04: nav disables at the 0001/9999 domain bounds', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/MonthMachine')

    const prev = page.getByTestId('month-prev')
    const next = page.getByTestId('month-next')
    const requests = page.getByTestId('month-requests')

    await expect(prev).toBeEnabled()
    await expect(next).toBeEnabled()

    await page.getByTestId('month-min').click()
    await expect(page.getByTestId('month-heading')).toContainText('January')
    await expect(page.locator('button[data-date="0001-01-01"]')).toBeVisible()
    await expect(prev).toBeDisabled()
    await expect(next).toBeEnabled()

    await page.getByTestId('month-max').click()
    await expect(page.getByTestId('month-heading')).toContainText('December 9999')
    await expect(next).toBeDisabled()
    await expect(prev).toBeEnabled()
    await expect(requests).toHaveText('none')
  })

  test('CA-MONTH-09/10: omitted month follows value, keeps user nav while mounted, reseeds on remount', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/UncontrolledMonth')

    const heading = page.getByTestId('unc-heading')
    const value = page.getByTestId('unc-value')

    await expect(heading).toContainText('September 2024')
    await expect(value).toHaveText('2024-09-18')

    // User navigation commits internally without emitting onChange.
    await page.getByTestId('unc-next').click()
    await expect(heading).toContainText('October 2024')
    await expect(value).toHaveText('2024-09-18')

    // Hide without unmounting keeps the pane.
    await page.getByTestId('unc-hide').click()
    await page.getByTestId('unc-show').click()
    await expect(heading).toContainText('October 2024')

    // Remount reseeds from value.
    await page.getByTestId('unc-unmount').click()
    await page.getByTestId('unc-remount').click()
    await expect(heading).toContainText('September 2024')

    // A new value re-seats the pane.
    await page.getByTestId('unc-set-april').click()
    await expect(heading).toContainText('April 2024')
    await expect(value).toHaveText('2024-04-10')
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
