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
    // 29 in-month days + 4 leading (Jan 28–31) + 2 trailing (Mar 1–2) padded buttons.
    await expect(page.locator('button[data-date]')).toHaveCount(35)
    await expect(page.locator('button[data-date="2024-02-01"]')).toBeVisible()
    await expect(page.locator('button[data-date="2024-02-29"]')).toBeVisible()

    // Feb 1 2024 was a Thursday: 4 padded January buttons precede it in the Sunday-first grid.
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow.locator('td')).toHaveCount(7)
    await expect(firstRow.locator('td').nth(0).locator('button')).toHaveAttribute(
      'data-date',
      '2024-01-28'
    )
    await expect(firstRow.locator('td').nth(0).locator('button')).toHaveAttribute(
      'data-outside-month',
      ''
    )
    await expect(firstRow.locator('td').nth(4).locator('button')).toHaveAttribute(
      'data-date',
      '2024-02-01'
    )
    await expect(firstRow.locator('td').nth(4).locator('button')).not.toHaveAttribute(
      'data-outside-month',
      ''
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

  test('CA-LOC-04/CA-GRID-05/CA-GRID-06: en-GB Monday-first headers, outside padding, full date names', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    const headers = page.locator('th[scope="col"]')
    await expect(headers).toHaveCount(7)
    await expect(headers.nth(0)).toHaveText('Mon')
    await expect(headers.nth(6)).toHaveText('Sun')
    await expect(headers.nth(0)).toHaveAccessibleName('Monday')

    // September 2024 Monday-first: Aug 26–31 lead, Oct 1–6 trail.
    await expect(page.locator('button[data-outside-month]')).toHaveCount(12)
    await expect(page.locator('button[data-date="2024-08-26"]')).toHaveAttribute(
      'data-outside-month',
      ''
    )
    await expect(page.locator('button[data-date="2024-09-01"]')).not.toHaveAttribute(
      'data-outside-month',
      ''
    )

    // Same visible number, unambiguous accessible names.
    await expect(page.locator('button[data-date="2024-10-01"]')).toHaveText('1')
    await expect(page.locator('button[data-date="2024-10-01"]')).toHaveAccessibleName(
      /Tuesday.*1.*October.*2024/
    )
    await expect(page.locator('button[data-date="2024-09-01"]')).toHaveAccessibleName(
      /Sunday.*1.*September.*2024/
    )
  })

  test('CA-LOC-07: runtime locale switch recomputes presentation without touching value or focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    await page.locator('button[data-date="2024-09-18"]').focus()
    // Synthetic toggle: a real click would move DOM focus to the button,
    // but the case asserts the grid-owned focus survives the switch.
    await page.getByTestId('gb-toggle-locale').dispatchEvent('click')

    // Sunday-first US presentation now.
    await expect(page.locator('th[scope="col"]').nth(0)).toHaveText('Sun')
    await expect(page.getByTestId('gb-heading')).toContainText('September 2024')
    // Value, focused ISO date, and both callback logs unchanged.
    await expect(page.getByTestId('gb-value')).toHaveText('2024-09-18')
    await expect(page.getByTestId('gb-changes')).toHaveText('none')
    await expect(page.getByTestId('gb-month-reqs')).toHaveText('none')
    await expect(page.locator('button[data-date="2024-09-18"]')).toHaveAttribute(
      'data-focused',
      ''
    )
    await expect(page.locator('button[data-date="2024-09-18"]')).toBeFocused()
  })

  test('CA-STATE-01/08: the today marker never follows selection or focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    const marker = page.locator('button[data-today]')
    await expect(marker).toHaveCount(1)
    await expect(marker).toHaveAttribute('data-date', '2024-09-10')
    await expect(marker).toHaveAttribute('aria-current', 'date')

    // Select and focus elsewhere: the marker stays put.
    await page.locator('button[data-date="2024-09-12"]').click()
    await page.locator('button[data-date="2024-09-20"]').focus()
    await expect(page.locator('button[data-today]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2024-09-10"]')).toHaveAttribute(
      'aria-current',
      'date'
    )
    await expect(page.locator('button[data-date="2024-09-12"]')).toHaveAttribute(
      'data-selected',
      ''
    )
  })

  test('CA-STATE-02/CA-KEY-08: arrow focus moves the tab stop without rewriting selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    await page.getByTestId('gb-next').focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('button[data-date="2024-09-18"]')).toBeFocused()

    await page.keyboard.press('ArrowRight')
    const moved = page.locator('button[data-date="2024-09-19"]')
    await expect(moved).toBeFocused()
    await expect(moved).toHaveAttribute('tabindex', '0')
    await expect(moved).toHaveAttribute('data-focused', '')
    await expect(page.locator('button[data-date="2024-09-18"]')).toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.locator('button[data-date="2024-09-18"]')).toHaveAttribute(
      'tabindex',
      '-1'
    )
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('gb-changes')).toHaveText('none')
  })

  test('CA-STATE-03: constrained pane tabs into the first enabled in-month day', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    const targets = page.locator('button[data-date][tabindex="0"]')
    await expect(targets).toHaveCount(1)
    await expect(targets).toHaveAttribute('data-date', '2024-04-05')
  })

  test('CA-STATE-04/CA-SINGLE-04: blocked dates are locked out in every modality', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    for (const blocked of ['2024-04-04', '2024-04-21', '2024-04-12']) {
      const button = page.locator(`button[data-date="${blocked}"]`)
      await expect(button).toBeDisabled()
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(button).toHaveAttribute('data-disabled', '')
    }
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeEnabled()

    // Synthetic dispatch bypasses native disabled suppression, so the
    // guard itself is what keeps these silent.
    const blocked = page.locator('button[data-date="2024-04-12"]')
    await blocked.dispatchEvent('click')
    await blocked.dispatchEvent('keydown', { key: 'Enter' })
    await blocked.dispatchEvent('keyup', { key: ' ' })
    await expect(page.getByTestId('con-changes')).toHaveText('none')
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('con-changes')).toHaveText('2024-04-10')
  })

  test('CA-KEY-01/05: arrows move by day and week, skipping blocked dates without wrapping', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('button[data-date="2024-04-09"]')).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    // 04-11–13 unavailable: the second Right lands on 04-14.
    await expect(page.locator('button[data-date="2024-04-14"]')).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(page.locator('button[data-date="2024-04-07"]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('button[data-date="2024-04-14"]')).toBeFocused()

    // Bounds stop movement: no wrap, no impossible month request.
    await page.locator('button[data-date="2024-04-05"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('button[data-date="2024-04-05"]')).toBeFocused()
    await page.locator('button[data-date="2024-04-20"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-20"]')).toBeFocused()
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')
    await expect(page.getByTestId('con-changes')).toHaveText('none')
  })

  test('CA-KEY-02: Home/End reach locale week boundaries, skipping inward past blocked dates', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-16"]').focus()
    await page.keyboard.press('Home')
    await expect(page.locator('button[data-date="2024-04-14"]')).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.locator('button[data-date="2024-04-20"]')).toBeFocused()

    // End boundary 04-13 blocked inward through 04-11: stays on the origin.
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('End')
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()
    await page.keyboard.press('Home')
    await expect(page.locator('button[data-date="2024-04-07"]')).toBeFocused()
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')
  })

  test('CA-KEY-04: modified navigation gestures stay unhandled', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Control+PageDown')
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')
    await expect(page.getByTestId('con-changes')).toHaveText('none')
  })

  test('CA-KEY-03: PageDown constrains Jan 31 to Feb 29 after the month commits', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/MonthMachine')

    await page.locator('button[data-date="2024-01-31"]').focus()
    await page.keyboard.press('PageDown')
    await expect(page.getByTestId('month-requests')).toHaveText('2024-02')
    await expect(page.locator('button[data-date="2024-01-31"]')).toBeFocused()

    await page.getByTestId('month-accept').click()
    await expect(page.getByTestId('month-heading')).toContainText('February 2024')
    await expect(page.locator('button[data-date="2024-02-29"]')).toBeFocused()
    await expect(page.locator('button[data-date="2024-02-29"]')).toHaveAttribute('tabindex', '0')
  })

  test('CA-KEY-07: cross-month keyboard focus waits for the controlled month', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await page.locator('button[data-date="2024-09-30"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('out-month-reqs')).toHaveText('2024-10')
    await expect(page.locator('button[data-date="2024-09-30"]')).toBeFocused()

    // Rejection keeps September; the repeat request is identical.
    await page.getByTestId('out-reject').click()
    await page.locator('button[data-date="2024-09-30"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('out-month-reqs')).toHaveText('2024-10')

    await page.getByTestId('out-accept').click()
    await expect(page.getByTestId('out-heading')).toContainText('October 2024')
    await expect(page.locator('button[data-date="2024-10-01"]')).toBeFocused()
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('out-changes')).toHaveText('none')
  })

  test('CA-MONTH-07/CA-SINGLE-07: outside activation requests month first, then the date', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await page.locator('button[data-date="2024-10-01"]').click()
    await expect(page.getByTestId('out-events')).toHaveText('m:2024-10,c:2024-10-01')
    await expect(page.getByTestId('out-heading')).toContainText('September 2024')

    await page.getByTestId('out-accept').click()
    await expect(page.getByTestId('out-heading')).toContainText('October 2024')
    await expect(page.locator('button[data-date="2024-10-01"]')).toBeFocused()
    await expect(page.locator('button[data-date="2024-10-01"]')).toHaveAttribute('tabindex', '0')
  })

  test('CA-MONTH-06/CA-GRID-12: an accepted month produces exactly one heading mutation', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await page.getByTestId('out-next').click()
    await page.evaluate(() => {
      const heading = document.querySelector('[data-testid="out-heading"]')!
      ;(window as unknown as { __headingMutations: number }).__headingMutations = 0
      new MutationObserver((records) => {
        const w = window as unknown as { __headingMutations: number }
        for (const record of records) {
          if (record.type === 'characterData') w.__headingMutations += 1
          for (const node of record.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE) w.__headingMutations += 1
          }
        }
      }).observe(heading, { characterData: true, childList: true, subtree: true })
    })
    await page.getByTestId('out-accept').click()
    await expect(page.getByTestId('out-heading')).toContainText('October 2024')
    const mutations = await page.evaluate(
      () => (window as unknown as { __headingMutations: number }).__headingMutations
    )
    expect(mutations).toBe(1)
  })

  test('CA-LOC-05: localized heading with target-month nav names and ISO callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await expect(page.getByTestId('out-heading')).toContainText('September 2024')
    await expect(page.getByTestId('out-prev')).toHaveAccessibleName('August 2024')
    await expect(page.getByTestId('out-next')).toHaveAccessibleName('October 2024')

    await page.getByTestId('out-next').click()
    await expect(page.getByTestId('out-month-reqs')).toHaveText('2024-10')
  })

  test('CA-GRID-09: the grid names itself from the stable heading id', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BritishGrid')

    const headingId = await page.getByTestId('gb-heading').getAttribute('id')
    expect(headingId).toBeTruthy()
    await expect(page.getByTestId('gb-grid')).toHaveAttribute('aria-labelledby', headingId!)
  })

  test('CA-MONTH-04: bounds disable a direction only when its target month is fully blocked', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await expect(page.getByTestId('out-prev')).toBeEnabled()
    await expect(page.getByTestId('out-next')).toBeEnabled()

    await page.getByTestId('out-toggle-bounds').click()
    await expect(page.getByTestId('out-prev')).toBeDisabled()
    await expect(page.getByTestId('out-next')).toBeDisabled()

    await page.getByTestId('out-toggle-bounds').click()
    await expect(page.getByTestId('out-prev')).toBeEnabled()
    await expect(page.getByTestId('out-next')).toBeEnabled()
  })

  test('CA-DYNAMIC-02/CA-STATE-06: live constraints relocate focus but preserve selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()

    // Synthetic toggle: the case changes constraints while focus is in
    // the grid, and a real click would move focus to the toggle first.
    await page.getByTestId('con-toggle-ten').dispatchEvent('click')
    // 04-11–13 already unavailable: focus skips forward to 04-14.
    await expect(page.locator('button[data-date="2024-04-14"]')).toBeFocused()
    await expect(page.locator('button[data-date="2024-04-14"]')).toHaveAttribute('tabindex', '0')
    const selected = page.locator('button[data-date="2024-04-10"]')
    await expect(selected).toHaveAttribute('data-selected', '')
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    await expect(selected).toHaveAttribute('data-disabled', '')
    await expect(selected).toHaveAttribute('tabindex', '-1')
  })

  test('CA-STATE-07: an all-disabled grid exposes no day tab stop', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.getByTestId('con-toggle-all').click()
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(0)

    // Native Tab skips the grid body in both directions (nav is disabled
    // too — every target-month date is unavailable — so the run starts
    // from the fixture buttons surrounding the grid).
    await page.getByTestId('con-toggle-ten').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('con-toggle-all')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('con-toggle-ten')).toBeFocused()
  })

  test('CA-LOC-06: inherited RTL reverses visual arrows while nav stays chronological', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RtlGrid')

    await page.locator('button[data-date="2024-01-15"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('button[data-date="2024-01-16"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-01-15"]')).toBeFocused()

    await page.getByTestId('rtl-next').click()
    await page.getByTestId('rtl-prev').click()
    await expect(page.getByTestId('rtl-month-reqs')).toHaveText('2024-02,2023-12')
  })

  test('CA-STATE-11: an omitted today marks the client-local date after mount', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/UncontrolledToday')

    const { localISO, sameMonth } = await page.evaluate(() => {
      const pad = (n: number) => String(n).padStart(2, '0')
      const local = new Date()
      const utc = new Date()
      const localISO = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`
      const sameMonth =
        local.getFullYear() === utc.getUTCFullYear() && local.getMonth() === utc.getUTCMonth()
      return { localISO, sameMonth }
    })
    // The uncontrolled pane seeds from the UTC month, so the local date
    // is only guaranteed rendered when both clocks agree on the month.
    if (sameMonth) {
      await expect(page.locator('button[data-today]')).toHaveCount(1)
      await expect(page.locator('button[data-today]')).toHaveAttribute('data-date', localISO)
      await expect(page.locator('button[data-today]')).toHaveAttribute('aria-current', 'date')
    } else {
      const marker = page.locator('button[data-today]')
      if ((await marker.count()) === 1) {
        await expect(marker).toHaveAttribute('data-date', localISO)
      }
    }
  })

  test('CA-KEY-10: a pending focus target dies when constraints stale it', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await page.locator('button[data-date="2024-09-30"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('out-month-reqs')).toHaveText('2024-10')

    // Binding maxes the grid at 2024-09-20 before the month is accepted.
    await page.getByTestId('out-toggle-bounds').click()
    await page.getByTestId('out-accept').click()
    await expect(page.getByTestId('out-heading')).toContainText('October 2024')

    // October 1 is disabled: no late focus, no tab stop anywhere.
    await expect(page.locator('button[data-date="2024-10-01"]')).not.toBeFocused()
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(0)
    await expect(page.getByTestId('out-changes')).toHaveText('none')
  })
})
