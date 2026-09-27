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

  test('CA-SINGLE-01/02/03/05: activation requests its ISO once per gesture; re-activating the selected date is silent (B-36); rejection leaves selection', async ({
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

    // Enter and Space each request the focused unselected date exactly
    // once (native button timing, no synthetic double-fire).
    await day12.focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('2024-04-10,2024-04-12')
    await expect(day12).toHaveAttribute('data-selected', '')
    await page.getByTestId('emit-toggle-accept').click() // reject: value stays 12th
    await day10.focus()
    await page.keyboard.press('Space')
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10')
    await expect(day12).toHaveAttribute('data-selected', '')
    await page.getByTestId('emit-toggle-accept').click() // accept again

    // Re-activating the already-selected date emits nothing — no request,
    // no null, not a toggle (B-36 restores CA-SINGLE-03's no-emit read).
    await day12.click()
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10')
    await day12.focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10')
    await page.keyboard.press('Space')
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10')
    await expect(day12).toHaveAttribute('data-selected', '')

    // Parent rejection: the request logs but selection stays put.
    await page.getByTestId('emit-toggle-accept').click()
    await day10.click()
    await expect(log).toHaveText('2024-04-10,2024-04-12,2024-04-10,2024-04-10')
    await expect(day12).toHaveAttribute('data-selected', '')
    await expect(day10).not.toHaveAttribute('data-selected', '')
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

test.describe('Calendar month/year views (FEATURES #10: B-23)', () => {
  test('CA-VIEW-01: folded day Calendar is complete with Month/Year drill-down and the day grid home', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/FoldedViews')

    const calendar = page.getByTestId('test-views-calendar')
    await expect(calendar).toHaveAttribute('data-mode', 'day')
    await expect(calendar).toHaveAttribute('data-view', 'day')

    const header = calendar.locator('[data-reference-calendar-header]')
    await expect(header.getByRole('button', { name: 'March 2024' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'May 2024' })).toBeVisible()
    const monthBtn = calendar.locator('[data-reference-calendar-month]')
    const yearBtn = calendar.locator('[data-reference-calendar-year]')
    await expect(monthBtn).toHaveText('April')
    await expect(monthBtn).toHaveAttribute('aria-pressed', 'false')
    await expect(yearBtn).toHaveText('2024')
    await expect(yearBtn).toHaveAttribute('aria-pressed', 'false')

    // Day Grid is the sole collection in the accessibility tree.
    await expect(calendar.locator('[role="grid"]')).toBeVisible()
    await expect(calendar.locator('[data-reference-calendar-months]')).toBeHidden()
    await expect(calendar.locator('[data-reference-calendar-years]')).toBeHidden()
  })

  test('CA-VIEW-02: Month toggles the private month view; consumer preventDefault cancels it', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/FoldedViews')

    const calendar = page.getByTestId('test-views-calendar')
    const monthBtn = calendar.locator('[data-reference-calendar-month]')

    await monthBtn.click()
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(monthBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(calendar.locator('[data-reference-calendar-months]')).toBeVisible()
    await expect(calendar.locator('[role="grid"]')).toBeHidden()
    await expect(calendar.locator('[data-reference-calendar-years]')).toBeHidden()
    await expect(page.getByTestId('views-changes')).toHaveText('none')
    await expect(page.getByTestId('views-month-reqs')).toHaveText('none')

    await monthBtn.click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(monthBtn).toHaveAttribute('aria-pressed', 'false')
    await expect(calendar.locator('[role="grid"]')).toBeVisible()

    // Consumer onClick runs first; preventDefault() cancels the toggle.
    await mount('components/Calendar/Calendar/BareHeadingViews')
    const bare = page.getByTestId('test-bare-calendar')
    await page.getByTestId('bare-veto').click()
    await page.getByTestId('bare-month').click()
    await expect(bare).toHaveAttribute('data-view', 'day')
    await page.getByTestId('bare-veto').click()
    await page.getByTestId('bare-month').click()
    await expect(bare).toHaveAttribute('data-view', 'month')
  })

  test('CA-VIEW-03: Year toggles the private year view and the day grid stands down', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/FoldedViews')

    const calendar = page.getByTestId('test-views-calendar')
    const yearBtn = calendar.locator('[data-reference-calendar-year]')
    const monthBtn = calendar.locator('[data-reference-calendar-month]')

    await yearBtn.click()
    await expect(calendar).toHaveAttribute('data-view', 'year')
    await expect(yearBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(monthBtn).toHaveAttribute('aria-pressed', 'false')
    await expect(calendar.locator('[data-reference-calendar-years]')).toBeVisible()
    await expect(calendar.locator('[role="grid"]')).toBeHidden()
    await expect(calendar.locator('[data-reference-calendar-months]')).toBeHidden()

    // Day-grid keyboard is not active while the year view is shown: arrows
    // from the header move nothing and request nothing.
    await yearBtn.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('views-changes')).toHaveText('none')
    await expect(page.getByTestId('views-month-reqs')).toHaveText('none')

    await yearBtn.click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(yearBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('CA-VIEW-04: Months renders twelve locale cells with whole-month min/max disabling', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/FoldedViews')

    const calendar = page.getByTestId('test-views-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()

    const cells = calendar.locator('button[data-reference-calendar-month-cell]')
    await expect(cells).toHaveCount(12)
    await expect(calendar.locator('button[data-month="2024-01"]')).toHaveText('Jan')
    await expect(calendar.locator('button[data-month="2024-12"]')).toHaveText('Dec')

    // Partial months stay enabled; whole months outside stay disabled.
    await expect(calendar.locator('button[data-month="2024-03"]')).toBeEnabled()
    await expect(calendar.locator('button[data-month="2024-10"]')).toBeEnabled()
    for (const whole of ['2024-01', '2024-02', '2024-11', '2024-12']) {
      const cell = calendar.locator(`button[data-month="${whole}"]`)
      await expect(cell).toBeDisabled()
      await expect(cell).toHaveAttribute('aria-disabled', 'true')
    }
    await expect(calendar.locator('button[data-month="2024-04"]')).toHaveAttribute(
      'data-current',
      ''
    )
    // The day table stands down: hidden, out of the accessibility tree.
    await expect(calendar.locator('[role="grid"]')).toBeHidden()
  })

  test('CA-VIEW-05/CA-MODE-01: an enabled month cell navigates and returns to day view only after the month is accepted', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    await expect(calendar).toHaveAttribute('data-mode', 'day')
    await calendar.locator('[data-reference-calendar-month]').click()

    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('2024-06')
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')
    // Navigation only: the view waits for the controlled month.
    await expect(calendar).toHaveAttribute('data-view', 'month')

    await page.getByTestId('cviews-accept').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(calendar.locator('button[data-date="2024-06-01"]')).toBeVisible()
    await expect(page.getByTestId('cviews-value')).toHaveText('2024-04-10')
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')

    // A disabled month cell emits nothing in any callback.
    await mount('components/Calendar/Calendar/FoldedViews')
    const bounded = page.getByTestId('test-views-calendar')
    await bounded.locator('[data-reference-calendar-month]').click()
    await bounded.locator('button[data-month="2024-01"]').click({ force: true })
    await expect(page.getByTestId('views-month-reqs')).toHaveText('none')
    await expect(page.getByTestId('views-changes')).toHaveText('none')
    await expect(bounded).toHaveAttribute('data-view', 'month')
  })

  test('CA-VIEW-06: Years windows ten either side unbounded, clamps at the domain edges, min-through-max when bounded', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    await calendar.locator('[data-reference-calendar-year]').click()
    const cells = calendar.locator('button[data-reference-calendar-year-cell]')
    await expect(cells).toHaveCount(21)
    await expect(calendar.locator('button[data-year="2014"]')).toHaveText('2014')
    await expect(calendar.locator('button[data-year="2034"]')).toHaveText('2034')
    await expect(calendar.locator('button[data-year="2024"]')).toHaveAttribute(
      'data-current',
      ''
    )

    // Domain edges clamp to a full in-domain run (the pane move returns
    // home, so each edge re-opens the year view).
    await mount('components/Calendar/Calendar/MonthMachine')
    const edge = page.getByTestId('test-month-calendar')
    await page.getByTestId('month-min').click()
    await page.getByTestId('month-year-drill').click()
    await expect(edge.locator('button[data-year="0001"]')).toBeVisible()
    await expect(edge.locator('button[data-year="0021"]')).toBeVisible()
    await expect(edge.locator('button[data-reference-calendar-year-cell]')).toHaveCount(21)
    await page.getByTestId('month-max').click()
    await page.getByTestId('month-year-drill').click()
    await expect(edge.locator('button[data-year="9999"]')).toBeVisible()
    await expect(edge.locator('button[data-year="9979"]')).toBeVisible()

    // Bounded: min-through-max years only; the 2024 pane year is absent.
    await mount('components/Calendar/Calendar/FoldedViews')
    const bounded = page.getByTestId('test-views-calendar')
    await bounded.locator('[data-reference-calendar-year]').click()
    await expect(
      bounded.locator('button[data-reference-calendar-year-cell]')
    ).toHaveCount(1)
    await expect(bounded.locator('button[data-year="2024"]')).toBeVisible()
  })

  test('CA-VIEW-07: an enabled year cell navigates preserving the month number', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2020"]').click()
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('2020-04')
    await expect(calendar).toHaveAttribute('data-view', 'year')

    await page.getByTestId('cviews-accept').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(calendar.locator('button[data-date="2020-04-01"]')).toBeVisible()

    // February stays February across the year jump.
    await calendar.locator('[data-reference-calendar-month]').click()
    await calendar.locator('button[data-month="2020-02"]').click()
    await page.getByTestId('cviews-accept').click()
    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2023"]').click()
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('2023-02')
  })

  test('CA-VIEW-08: Previous/Next are native-disabled and silent in month and year view', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    const prev = calendar.locator('[data-reference-calendar-header] > button').first()
    const next = calendar.locator('[data-reference-calendar-header] > button').last()

    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(prev).toBeDisabled()
    await expect(next).toBeDisabled()
    // Synthetic dispatch bypasses native suppression; the view guards
    // keep the request seams silent anyway.
    await prev.dispatchEvent('click')
    await next.dispatchEvent('click')
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('none')
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')

    await calendar.locator('[data-reference-calendar-year]').click()
    await expect(prev).toBeDisabled()
    await expect(next).toBeDisabled()
    await prev.dispatchEvent('click')
    await next.dispatchEvent('click')
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('none')

    // Back in day view the directions re-enable per target coverage.
    await calendar.locator('[data-reference-calendar-year]').click()
    await expect(prev).toBeEnabled()
    await expect(next).toBeEnabled()
  })

  test('CA-VIEW-08: a completed range survives a view round-trip with no invented completion', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeViews')

    const calendar = page.getByTestId('test-rviews-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()
    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    // The completed interval still paints on rendered in-pane days, and no
    // completion was invented: the endpoints live outside the April pane,
    // so in-range paint plus callback silence is the round-trip proof.
    await expect(calendar.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-in-range',
      ''
    )
    await expect(calendar.locator('button[data-date="2024-04-15"]')).not.toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.getByTestId('rviews-changes')).toHaveText('none')
  })

  test('CA-VIEW-09: month and year cells paint range start, end, and in-range without preview', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeViews')

    const calendar = page.getByTestId('test-rviews-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()

    const march = calendar.locator('button[data-month="2024-03"]')
    const april = calendar.locator('button[data-month="2024-04"]')
    const may = calendar.locator('button[data-month="2024-05"]')
    const june = calendar.locator('button[data-month="2024-06"]')
    await expect(march).toHaveAttribute('data-range-start', '')
    await expect(june).toHaveAttribute('data-range-end', '')
    await expect(april).toHaveAttribute('data-in-range', '')
    await expect(may).toHaveAttribute('data-in-range', '')
    await expect(april).toHaveAttribute('data-selected', '')

    // Hovering a month cell invents no preview attributes.
    const before = await april.getAttribute('data-in-range')
    await june.hover()
    await expect(april).toHaveAttribute('data-in-range', before ?? '')
    await expect(page.getByTestId('rviews-changes')).toHaveText('none')

    // Year view of a 2023–2025 range marks those years the same way.
    await page.getByTestId('rviews-3yr').click()
    await calendar.locator('[data-reference-calendar-year]').click()
    await expect(calendar.locator('button[data-year="2023"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(calendar.locator('button[data-year="2025"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(calendar.locator('button[data-year="2024"]')).toHaveAttribute(
      'data-in-range',
      ''
    )
  })

  test('CA-VIEW-10: month and year grids move focus in a three-column field without selecting', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()

    // One tab stop in the month collection, on current April.
    await expect(calendar.locator('button[data-month][tabindex="0"]')).toHaveCount(1)
    await expect(calendar.locator('button[data-month][tabindex="0"]')).toHaveAttribute(
      'data-month',
      '2024-04'
    )

    // Each arrow from April: Right→May, Left→March, Down→July, Up→January.
    await calendar.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(calendar.locator('button[data-month="2024-05"]')).toBeFocused()
    await calendar.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(calendar.locator('button[data-month="2024-03"]')).toBeFocused()
    await calendar.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowDown')
    await expect(calendar.locator('button[data-month="2024-07"]')).toBeFocused()
    await calendar.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowUp')
    await expect(calendar.locator('button[data-month="2024-01"]')).toBeFocused()
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')

    // Enter on June navigates (CA-VIEW-05), never selects.
    await calendar.locator('button[data-month="2024-06"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cviews-month-reqs')).toHaveText('2024-06')
    await expect(page.getByTestId('cviews-changes')).toHaveText('none')

    // Shorter vector on Years.
    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2024"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(calendar.locator('button[data-year="2025"]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(calendar.locator('button[data-year="2028"]')).toBeFocused()

    // Inherited RTL reverses only the horizontal arrows.
    await mount('components/Calendar/Calendar/RtlGrid')
    const rtl = page.getByTestId('test-rtl-calendar')
    await page.getByTestId('rtl-month').click()
    await rtl.locator('button[data-month="2024-04"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(rtl.locator('button[data-month="2024-05"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(rtl.locator('button[data-month="2024-04"]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(rtl.locator('button[data-month="2024-07"]')).toBeFocused()
  })

  test('CA-VIEW-11: view and month announce through one live Heading without a global announcer', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/BareHeadingViews')

    const calendar = page.getByTestId('test-bare-calendar')
    const heading = page.getByTestId('bare-heading')
    await expect(heading).toHaveAttribute('aria-live', 'polite')
    await expect(heading).toHaveAttribute('aria-atomic', 'true')
    await expect(heading).toHaveText('April 2024')

    // Entering month view mutates the Heading to the year exactly once.
    await page.evaluate(() => {
      const node = document.querySelector('[data-testid="bare-heading"]')!
      ;(window as unknown as { __headingMutations: number }).__headingMutations = 0
      new MutationObserver((records) => {
        const w = window as unknown as { __headingMutations: number }
        for (const record of records) {
          if (record.type === 'characterData') w.__headingMutations += 1
          for (const added of record.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE) w.__headingMutations += 1
          }
        }
      }).observe(node, { characterData: true, childList: true, subtree: true })
    })
    await page.getByTestId('bare-month').click()
    await expect(heading).toHaveText('2024')
    expect(
      await page.evaluate(
        () => (window as unknown as { __headingMutations: number }).__headingMutations
      )
    ).toBe(1)

    // Activating June and accepting the month announces June 2024 once.
    await page.evaluate(() => {
      ;(window as unknown as { __headingMutations: number }).__headingMutations = 0
    })
    await calendar.locator('button[data-month="2024-06"]').click()
    await page.getByTestId('bare-accept').click()
    await expect(heading).toHaveText('June 2024')
    expect(
      await page.evaluate(
        () => (window as unknown as { __headingMutations: number }).__headingMutations
      )
    ).toBe(1)

    // The day Grid still names itself from the Heading; Month/Year keep
    // their locale names.
    const headingId = await heading.getAttribute('id')
    await expect(page.getByTestId('bare-grid')).toHaveAttribute('aria-labelledby', headingId!)
    await expect(page.getByTestId('bare-month')).toHaveAccessibleName('June')
    await expect(page.getByTestId('bare-year')).toHaveAccessibleName('2024')
  })

  test('CA-VIEW-11: the folded Heading keeps its live region across view toggles', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ControlledViews')

    const calendar = page.getByTestId('test-cviews-calendar')
    const heading = calendar.locator('[data-reference-calendar-heading]')
    await expect(heading).toHaveAttribute('aria-live', 'polite')
    await expect(heading).toHaveAttribute('aria-atomic', 'true')

    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(heading).toHaveAttribute('aria-live', 'polite')
    await expect(calendar.locator('[data-reference-calendar-month]')).toHaveAccessibleName(
      'April'
    )
    await expect(calendar.locator('[data-reference-calendar-year]')).toHaveAccessibleName(
      '2024'
    )
    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar.locator('[role="grid"]')).toBeVisible()
  })

  test('CA-VIEW-12: mode changes reset the private view to the home collection without stealing focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ModeSwitch')

    const calendar = page.getByTestId('test-mswitch-calendar')
    await expect(calendar).toHaveAttribute('data-mode', 'day')
    await expect(calendar).toHaveAttribute('data-view', 'day')

    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar).toHaveAttribute('data-view', 'month')

    // Focus stays outside on the mode button; the switch resets the view.
    await page.getByTestId('mswitch-month').focus()
    await page.getByTestId('mswitch-month').click()
    await expect(calendar).toHaveAttribute('data-mode', 'month')
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(calendar.locator('[data-reference-calendar-months]')).toBeVisible()
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)
    await expect(page.getByTestId('mswitch-month')).toBeFocused()
    await expect(page.getByTestId('mswitch-changes')).toHaveText('none')

    await page.getByTestId('mswitch-year').click()
    await expect(calendar).toHaveAttribute('data-mode', 'year')
    await expect(calendar).toHaveAttribute('data-view', 'year')
    await expect(calendar.locator('[data-reference-calendar-years]')).toBeVisible()
    await expect(calendar.locator('[data-reference-calendar-months]')).toHaveCount(0)

    await page.getByTestId('mswitch-range').click()
    await expect(calendar).toHaveAttribute('data-mode', 'range')
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(calendar.locator('[role="grid"]')).toBeVisible()

    await page.getByTestId('mswitch-day').click()
    await expect(calendar).toHaveAttribute('data-mode', 'day')
    await expect(calendar).toHaveAttribute('data-view', 'day')
  })

  test('CA-MODE-02: month mode publishes YYYY-MM; Year drill-down navigates without selecting', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/MonthMode')

    const calendar = page.getByTestId('test-mmonth-calendar')
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)

    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('mmonth-changes')).toHaveText('2024-06')
    await expect(page.getByTestId('mmonth-value')).toHaveText('2024-06')
    await expect(calendar.locator('button[data-month="2024-06"]')).toHaveAttribute(
      'data-selected',
      ''
    )

    // Re-activating the selected month is silent (B-36 in month mode).
    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('mmonth-changes')).toHaveText('2024-06')

    // Year drill-down is navigation: requests 2020-04, selects nothing.
    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2020"]').click()
    await expect(page.getByTestId('mmonth-month-reqs')).toHaveText('2020-04')
    await expect(page.getByTestId('mmonth-changes')).toHaveText('2024-06')
    await page.getByTestId('mmonth-accept').click()
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(calendar.locator('button[data-month="2020-04"]')).toBeVisible()
  })

  test('CA-MODE-03: year mode publishes YYYY and Month/Year never reveal a day table', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/YearMode')

    const calendar = page.getByTestId('test-ymode-calendar')
    await expect(calendar).toHaveAttribute('data-view', 'year')
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)
    await expect(calendar.locator('[data-reference-calendar-months]')).toHaveCount(0)

    await calendar.locator('button[data-year="2026"]').click()
    await expect(page.getByTestId('ymode-changes')).toHaveText('2026')
    await expect(page.getByTestId('ymode-value')).toHaveText('2026')

    // Re-activating the selected year is silent (B-36 in year mode).
    await calendar.locator('button[data-year="2026"]').click()
    await expect(page.getByTestId('ymode-changes')).toHaveText('2026')

    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)
    await calendar.locator('[data-reference-calendar-year]').click()
    await expect(calendar).toHaveAttribute('data-view', 'year')
    await expect(calendar.locator('[role="grid"]')).toHaveCount(0)
  })

  test('CA-VIEW-13 (second fixture): a custom header without Month/Year has no drill-down and stays in day view', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/SingleDate')

    const calendar = page.getByTestId('test-calendar')
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(calendar.locator('[data-reference-calendar-month]')).toHaveCount(0)
    await expect(calendar.locator('[data-reference-calendar-year]')).toHaveCount(0)
    await expect(calendar.locator('[role="grid"]')).toBeVisible()
    // The first CA-VIEW-13 fixture (custom Days renderer + defaulted
    // Header/Months/Years) needs HOLD #5 Day parts and stays unproven.
  })

  test('CA-MODE-05: a fully unavailable month or year is disabled and silent; partial units stay enabled', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/MonthMode')

    const calendar = page.getByTestId('test-mmonth-calendar')
    await expect(calendar.locator('button[data-month="2024-06"]')).toBeEnabled()

    await page.getByTestId('mmonth-block-june').dispatchEvent('click')
    const june = calendar.locator('button[data-month="2024-06"]')
    await expect(june).toBeDisabled()
    await june.click({ force: true })
    await expect(page.getByTestId('mmonth-changes')).toHaveText('none')
    await expect(calendar.locator('button[data-month="2024-07"]')).toBeEnabled()

    await mount('components/Calendar/Calendar/YearMode')
    const years = page.getByTestId('test-ymode-calendar')
    await expect(years.locator('button[data-year="2025"]')).toBeEnabled()
    await page.getByTestId('ymode-block-2025').dispatchEvent('click')
    const y2025 = years.locator('button[data-year="2025"]')
    await expect(y2025).toBeDisabled()
    await y2025.click({ force: true })
    await expect(page.getByTestId('ymode-changes')).toHaveText('none')
    await expect(years.locator('button[data-year="2024"]')).toBeEnabled()
  })
})
