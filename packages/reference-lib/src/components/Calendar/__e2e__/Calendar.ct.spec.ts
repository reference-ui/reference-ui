import { test, expect, snap } from '../../../../playwright/ct'

// Landing-sequence engine scope (DIAG D1): Safari/WebKit never delivers
// click-focus to buttons/links (mousedown blurs to body) and its native Tab
// order skips them, honoring text controls + explicit tabindex stops only.
// `engineOf` sniffs the Playwright project (`react19` on agentct Chromium,
// `react19-firefox`/`react19-webkit` on the sweep vehicle) so specs can
// compensate delivery (P1) or assert the deterministic platform outcome (P2).
function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

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

  test('CA-STATE-04/CA-SINGLE-04: out-of-bounds days are natively disabled; unavailable days stay focusable but silent (W-21)', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    for (const blocked of ['2024-04-04', '2024-04-21']) {
      const button = page.locator(`button[data-date="${blocked}"]`)
      await expect(button).toBeDisabled()
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(button).toHaveAttribute('data-disabled', '')
    }
    // Unavailable (W-21): focusable — no native disabled, aria-disabled,
    // data-unavailable. (Playwright's toBeEnabled treats aria-disabled as
    // disabled, so focusability is asserted by focusing directly.)
    const unavailable = page.locator('button[data-date="2024-04-12"]')
    await expect(unavailable).not.toHaveAttribute('disabled', '')
    await expect(unavailable).toHaveAttribute('aria-disabled', 'true')
    await expect(unavailable).toHaveAttribute('data-unavailable', '')
    await expect(unavailable).not.toHaveAttribute('data-disabled', '')
    await unavailable.focus()
    await expect(unavailable).toBeFocused()
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeEnabled()

    // Synthetic dispatch bypasses native disabled suppression, so the
    // guard itself is what keeps out-of-bounds dates silent.
    await page.locator('button[data-date="2024-04-04"]').dispatchEvent('click')
    await expect(page.getByTestId('con-changes')).toHaveText('none')

    // Real gestures on the unavailable day are silent in every modality
    // and leave the roving tab stop untouched. Force bypasses Playwright's
    // aria-disabled actionability gate; the click itself is still trusted.
    await unavailable.click({ force: true })
    await unavailable.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press(' ')
    await expect(page.getByTestId('con-changes')).toHaveText('none')
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')
    await expect(page.locator('button[data-date="2024-04-05"]')).toHaveAttribute('tabindex', '0')

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('con-changes')).toHaveText('2024-04-10')
  })

  test('CA-KEY-01/05: arrows move by day and week, landing on unavailable days and stopping at bounds without wrapping (W-21)', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('button[data-date="2024-04-09"]')).toBeFocused()

    // 04-11–13 unavailable but focusable: every Right lands in sequence.
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-11"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-13"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
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

  test('CA-KEY-02: Home/End reach locale week boundaries, landing on unavailable boundaries and skipping inward past out-of-bounds dates (W-21)', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-16"]').focus()
    await page.keyboard.press('Home')
    await expect(page.locator('button[data-date="2024-04-14"]')).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.locator('button[data-date="2024-04-20"]')).toBeFocused()

    // End boundary 04-13 is unavailable but focusable: End lands on it.
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('End')
    await expect(page.locator('button[data-date="2024-04-13"]')).toBeFocused()
    await page.keyboard.press('Home')
    await expect(page.locator('button[data-date="2024-04-07"]')).toBeFocused()

    // Out-of-bounds boundary dates still skip inward: Home from 04-05
    // walks 03-31 inward through 04-01–04 and stays on the origin.
    await page.locator('button[data-date="2024-04-05"]').focus()
    await page.keyboard.press('Home')
    await expect(page.locator('button[data-date="2024-04-05"]')).toBeFocused()
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

  test('CA-DYNAMIC-02/CA-STATE-06: newly unavailable keeps focus but goes silent; newly out-of-bounds relocates; selection preserved (W-21)', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()

    // Synthetic toggles: the case changes constraints while focus is in
    // the grid, and a real click would move focus to the toggle first.
    await page.getByTestId('con-toggle-ten').dispatchEvent('click')
    // Unavailable stays focusable: focus and the tab stop stay on 04-10,
    // selection paint is preserved, activation goes silent.
    const selected = page.locator('button[data-date="2024-04-10"]')
    await expect(selected).toBeFocused()
    await expect(selected).toHaveAttribute('tabindex', '0')
    await expect(selected).toHaveAttribute('data-selected', '')
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    await expect(selected).toHaveAttribute('data-unavailable', '')
    await expect(selected).not.toHaveAttribute('data-disabled', '')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('con-changes')).toHaveText('2024-04-10')

    // Binding min to 04-15 pushes 04-10 out of bounds: focus relocates
    // forward-first to 04-15 — 04-11–14 are out of bounds too — while
    // selection paint is preserved.
    await page.getByTestId('con-toggle-bounds').dispatchEvent('click')
    await expect(page.locator('button[data-date="2024-04-15"]')).toBeFocused()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute('tabindex', '0')
    await expect(selected).toHaveAttribute('data-selected', '')
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    await expect(selected).toHaveAttribute('data-disabled', '')
    await expect(selected).toHaveAttribute('tabindex', '-1')
  })

  test('CA-STATE-07: an all-unavailable grid keeps its sole tab stop but selects nothing (W-21)', async ({ mount, page }) => {
    await mount('components/Calendar/Calendar/Constrained')

    await page.getByTestId('con-toggle-all').click()
    const targets = page.locator('button[data-date][tabindex="0"]')
    await expect(targets).toHaveCount(1)
    await expect(targets).toHaveAttribute('data-date', '2024-04-05')

    // Out-of-bounds paint wins where both apply; nav stays disabled —
    // no target-month date is selectable.
    await expect(page.locator('button[data-date="2024-04-04"]')).toHaveAttribute('data-disabled', '')
    await expect(page.locator('button[data-date="2024-04-04"]')).not.toHaveAttribute(
      'data-unavailable',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-unavailable',
      ''
    )
    await expect(page.getByTestId('con-prev')).toBeDisabled()
    await expect(page.getByTestId('con-next')).toBeDisabled()

    // Pointer and keyboard activation are silent everywhere (force
    // bypasses the aria-disabled actionability gate; the click is trusted).
    await page.locator('button[data-date="2024-04-10"]').click({ force: true })
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('con-changes')).toHaveText('none')
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')

    // The grid tab stop is reachable in native order: Shift+Tab from the
    // first fixture button lands on it (nav is disabled, so nothing sits
    // between the grid and the fixture buttons).
    await page.getByTestId('con-toggle-ten').focus()
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('button[data-date="2024-04-05"]')).toBeFocused()
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
    // P1 (F34, DIAG D1): WebKit click-focus never lands on buttons (mousedown
    // blurs to body), so re-deliver the Chromium focus state; the no-steal
    // assertion below then tests the mode switch on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('mswitch-month').focus()
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
    // Header/Months/Years) is proven in the day-parts suite below.
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

test.describe('Calendar custom days + week start (W-20/W-21)', () => {
  test('W-20: Day renders custom content, null keeps the default, selection/disabled/keyboard compose', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/CustomDayCells')

    // Custom content on plain, unavailable, and out-of-bounds days alike.
    await expect(page.getByTestId('day-dot-2024-04-08')).toHaveText('●●')
    await expect(page.getByTestId('day-dot-2024-04-12')).toHaveText('●')
    await expect(page.getByTestId('day-dot-2024-04-02')).toHaveText('●')
    // Null return keeps the default locale number.
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveText('15')

    // Selection composes: the dotted day selects with full selected paint.
    await page.locator('button[data-date="2024-04-08"]').click()
    await expect(page.getByTestId('custom-changes')).toHaveText('2024-04-08')
    await expect(page.getByTestId('custom-value')).toHaveText('2024-04-08')
    const dotted = page.locator('button[data-date="2024-04-08"]')
    await expect(dotted).toHaveAttribute('aria-selected', 'true')
    await expect(dotted).toHaveAttribute('data-selected', '')

    // Disabled and unavailable custom days render dots but stay silent
    // (force bypasses the disabled/aria-disabled actionability gates).
    await page.locator('button[data-date="2024-04-02"]').click({ force: true })
    await page.locator('button[data-date="2024-04-12"]').click({ force: true })
    await expect(page.getByTestId('custom-changes')).toHaveText('2024-04-08')

    // Keyboard traverses custom cells; Enter on the unavailable one is silent.
    await page.locator('button[data-date="2024-04-08"]').focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-12"]')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('custom-changes')).toHaveText('2024-04-08')
  })

  test('W-21: firstDayOfWeek overrides the locale default in both directions', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/WeekStartOverride')

    const usHeaders = page.getByTestId('ws-us-grid').locator('th')
    await expect(usHeaders).toHaveText(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    const gbHeaders = page.getByTestId('ws-gb-grid').locator('th')
    await expect(gbHeaders).toHaveText(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

    // April 2024 Monday-first has no leading padding (the 1st is a
    // Monday); Sunday-first leads with Sunday March 31.
    await expect(
      page.getByTestId('ws-us-grid').locator('button[data-date="2024-03-31"]')
    ).toHaveCount(0)
    await expect(
      page.getByTestId('ws-gb-grid').locator('button[data-date="2024-03-31"]')
    ).toHaveCount(1)

    // Home respects the override: Monday in the US grid, Sunday in GB.
    await page.getByTestId('ws-us-grid').locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Home')
    await expect(
      page.getByTestId('ws-us-grid').locator('button[data-date="2024-04-08"]')
    ).toBeFocused()
    await page.getByTestId('ws-gb-grid').locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Home')
    await expect(
      page.getByTestId('ws-gb-grid').locator('button[data-date="2024-04-07"]')
    ).toBeFocused()
  })
})

test.describe('Calendar day parts (FEATURES #5)', () => {
  const stateOf = (page: import('@playwright/test').Page, date: string) =>
    page.evaluate(
      (d) =>
        (window as unknown as { __dayStates: Record<string, unknown> }).__dayStates[d],
      date
    )

  test('CA-DAY-01: default Days render each locale day number with exactly one button per gridcell', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayPartsDefault')

    const grid = page.getByTestId('ddef-grid')
    await expect(grid.locator('button[data-date="2024-04-10"]')).toHaveText('10')
    await expect(grid.locator('button[data-date="2024-05-01"]')).toHaveText('1')
    // April 2024 Monday-first: 30 in-month + 5 trailing, all in-domain.
    await expect(grid.locator('tbody td')).toHaveCount(35)
    await expect(grid.locator('tbody td button')).toHaveCount(35)
    // The visible number is not the accessible name: no duplicated text.
    const name = await grid
      .locator('button[data-date="2024-04-10"]')
      .getAttribute('aria-label')
    expect(name).not.toBe('10')
    expect(name).toContain('April')
  })

  test('CA-DAY-02: the Day render state carries exactly ten fields for single, today, outside, and disabled dates', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayCustom')

    const expectedKeys = [
      'date',
      'formattedDay',
      'outsideMonth',
      'today',
      'selected',
      'disabled',
      'rangeStart',
      'rangeEnd',
      'inRange',
      'preview',
    ]
    // Every recorded state — not just the sampled dates — is exact.
    const violations = await page.evaluate((keys) => {
      const states = (window as unknown as { __dayStates: Record<string, object> }).__dayStates
      return Object.entries(states)
        .filter(([, s]) => JSON.stringify(Object.keys(s)) !== JSON.stringify(keys))
        .map(([d]) => d)
    }, expectedKeys)
    expect(violations).toEqual([])

    await expect
      .poll(async () => stateOf(page, '2024-04-10'))
      .toEqual({
        date: '2024-04-10',
        formattedDay: '10',
        outsideMonth: false,
        today: false,
        selected: true,
        disabled: false,
        rangeStart: false,
        rangeEnd: false,
        inRange: false,
        preview: false,
      })
    expect(await stateOf(page, '2024-04-11')).toEqual({
      date: '2024-04-11',
      formattedDay: '11',
      outsideMonth: false,
      today: true,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    })
    expect(await stateOf(page, '2024-04-12')).toEqual({
      date: '2024-04-12',
      formattedDay: '12',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: true,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    })
    expect(await stateOf(page, '2024-05-01')).toEqual({
      date: '2024-05-01',
      formattedDay: '1',
      outsideMonth: true,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    })
  })

  test('CA-DAY-03: a completed controlled range is inclusive with distinguished endpoints in render state', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-completed-13').click()

    const base = {
      outsideMonth: false,
      today: false,
      disabled: false,
      preview: false,
    }
    expect(await stateOf(page, '2024-04-09')).toEqual({
      date: '2024-04-09',
      formattedDay: '9',
      ...base,
      selected: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
    })
    expect(await stateOf(page, '2024-04-10')).toEqual({
      date: '2024-04-10',
      formattedDay: '10',
      ...base,
      selected: true,
      rangeStart: true,
      rangeEnd: false,
      inRange: true,
    })
    for (const d of ['2024-04-11', '2024-04-12']) {
      expect(await stateOf(page, d)).toEqual({
        date: d,
        formattedDay: String(Number(d.slice(8, 10))),
        ...base,
        selected: true,
        rangeStart: false,
        rangeEnd: false,
        inRange: true,
      })
    }
    expect(await stateOf(page, '2024-04-13')).toEqual({
      date: '2024-04-13',
      formattedDay: '13',
      ...base,
      selected: true,
      rangeStart: false,
      rangeEnd: true,
      inRange: true,
    })
    expect(await stateOf(page, '2024-04-14')).toEqual({
      date: '2024-04-14',
      formattedDay: '14',
      ...base,
      selected: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
    })
  })

  test('CA-DAY-04: pending preview is public render state without touching controlled selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    await page.locator('button[data-date="2024-04-13"]').hover()
    expect(await stateOf(page, '2024-04-10')).toEqual({
      date: '2024-04-10',
      formattedDay: '10',
      outsideMonth: false,
      today: false,
      selected: true,
      disabled: false,
      rangeStart: true,
      rangeEnd: false,
      inRange: true,
      preview: true,
    })
    expect(await stateOf(page, '2024-04-11')).toEqual({
      date: '2024-04-11',
      formattedDay: '11',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: true,
      preview: true,
    })
    expect(await stateOf(page, '2024-04-13')).toEqual({
      date: '2024-04-13',
      formattedDay: '13',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: true,
      inRange: true,
      preview: true,
    })
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')

    // Hover clears; keyboard focus drives the next preview, and the prior
    // candidate returns every selection/range field to false.
    await page.getByTestId('range-after').hover()
    await page.locator('button[data-date="2024-04-12"]').focus()
    expect(await stateOf(page, '2024-04-12')).toEqual({
      date: '2024-04-12',
      formattedDay: '12',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: true,
      inRange: true,
      preview: true,
    })
    expect(await stateOf(page, '2024-04-13')).toEqual({
      date: '2024-04-13',
      formattedDay: '13',
      outsideMonth: false,
      today: false,
      selected: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    })
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
  })

  test('CA-DAY-05: custom Day keeps children, native props, StyleProps, and a stable native ref across rerenders', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayCustom')

    const day8 = page.locator('button[data-date="2024-04-08"]')
    const day10 = page.locator('button[data-date="2024-04-10"]')
    await expect(page.getByTestId('dcustom-dot-2024-04-08')).toHaveText('●●')
    await expect(day8).toHaveAttribute('title', 'day 2024-04-08')
    await expect(day8).toHaveAttribute('data-booking-count', '2')
    await expect(day8).toHaveClass(/dcustom-day/)
    await expect(day8).toHaveCSS('color', 'rgb(255, 0, 0)')
    // Consumer fontWeight wins over the managed selected weight (600).
    await expect(day10).toHaveCSS('font-weight', '700')

    const refIsButton = () =>
      page.evaluate(() => {
        const w = window as unknown as { __dayRef?: Element | null }
        return w.__dayRef === document.querySelector('button[data-date="2024-04-10"]')
      })
    expect(await refIsButton()).toBe(true)

    // A no-op rerender keeps the exact button attached: the stable ref
    // still receives that node (an intermediate null+set from React 19
    // ref-effect semantics inside the button primitive is supported
    // cleanup behavior, not a remount).
    await page.getByTestId('dcustom-bump').click()
    expect(await refIsButton()).toBe(true)
    const refLog = await page.evaluate(
      () => (window as unknown as { __refLog: string[] }).__refLog
    )
    expect(refLog[refLog.length - 1]).toBe('set:2024-04-10')

    // Unmount (month change) runs supported cleanup exactly once.
    await page.getByTestId('dcustom-month').click()
    await expect(page.locator('button[data-date="2024-05-01"]')).toBeVisible()
    const refLogAfter = await page.evaluate(
      () => (window as unknown as { __refLog: string[] }).__refLog
    )
    expect(refLogAfter[refLogAfter.length - 1]).toBe('null')
  })

  test('CA-DAY-06: managed Day semantics stay authoritative over conflicting consumer props', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayCustom')
    await page.getByTestId('dcustom-conflict').click()

    const day10 = page.locator('button[data-date="2024-04-10"]')
    const day11 = page.locator('button[data-date="2024-04-11"]')
    const day12 = page.locator('button[data-date="2024-04-12"]')
    const day2 = page.locator('button[data-date="2024-04-02"]')

    // Selected day: managed label, selection, enabled state, sole tab stop.
    const conflictLabel = await day10.getAttribute('aria-label')
    expect(conflictLabel).not.toBe('forged label')
    await expect(day10).toHaveAttribute('aria-selected', 'true')
    await expect(day10).toBeEnabled()
    await expect(day10).not.toHaveAttribute('aria-disabled', 'true')
    await expect(day10).toHaveAttribute('tabindex', '0')
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
    await expect(day10).toHaveAttribute('data-selected', '')
    await expect(day10).not.toHaveAttribute('data-today', '')
    // The generated td alone exposes the managed cell selection.
    await expect(day10.locator('xpath=ancestor::td[1]')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(day11.locator('xpath=ancestor::td[1]')).toHaveAttribute(
      'aria-selected',
      'false'
    )
    // Unrelated decoration survives.
    await expect(day10).toHaveAttribute('aria-describedby', 'dcustom-desc')

    // Today, unavailable, out-of-bounds, and outside-month keep managed state.
    await expect(day11).toHaveAttribute('data-today', '')
    await expect(day12).toHaveAttribute('aria-disabled', 'true')
    await expect(day12).toHaveAttribute('data-unavailable', '')
    // Unavailable stays natively enabled (W-21): no native disabled
    // attribute despite the conflicting consumer prop. (Playwright's
    // toBeEnabled counts aria-disabled, so the native attribute is
    // asserted directly.)
    await expect(day12).not.toHaveAttribute('disabled', '')
    await expect(day2).toBeDisabled()
    await expect(day2).toHaveAttribute('data-disabled', '')
    await expect(page.locator('button[data-date="2024-05-01"]')).toHaveAttribute(
      'data-outside-month',
      ''
    )
    await expect(day10).not.toHaveAttribute('data-outside-month', '')

    // Forged range attributes never appear in single mode.
    await expect(page.locator('button[data-date][data-range-start]')).toHaveCount(0)
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    await expect(page.locator('button[data-date][data-in-range]')).toHaveCount(0)

    // The managed label equals the default-path full date name.
    await page.getByTestId('dcustom-plain').click()
    await expect(day10).toHaveAttribute('aria-label', conflictLabel!)
  })

  test('CA-DAY-07/CA-KEY-09: consumer Day events run first and preventDefault cancels navigation and selection (chromium)', async ({
    mount,
    page,
  }) => {
    // CA-DAY-07 is tagged [browser:all]; the CT harness runs Desktop
    // Chrome only, so Firefox/WebKit coverage is NOT proven here (same
    // honest scope as CA-ENV-04 below).
    await mount('components/Calendar/Calendar/DayCustom')
    const log = page.getByTestId('dcustom-log')

    // Uncanceled pointer order: Day.onClick → onChange(date).
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(log).toHaveText('click:2024-04-10,change:2024-04-10')

    // Enter order: Day.onKeyDown → Day.onClick → onChange(date).
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('key:2024-04-10:Enter,click:2024-04-10,change:2024-04-10')

    // Space follows native button keyup timing with one request.
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Space')
    await expect(log).toHaveText('key:2024-04-10: ,click:2024-04-10,change:2024-04-10')

    // Arrow order: Day.onKeyDown → focus(nextDate), no selection.
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(log).toHaveText('key:2024-04-10:ArrowRight')
    await expect(page.locator('button[data-date="2024-04-11"]')).toBeFocused()

    // Cancellation in onClick suppresses selection; value stays empty.
    await page.getByTestId('dcustom-veto-click').click()
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(log).toHaveText('click:2024-04-10')
    await expect(page.getByTestId('dcustom-value')).toHaveText('None')
    await page.getByTestId('dcustom-veto-click').click()

    // Cancellation in onKeyDown suppresses movement and activation.
    await page.getByTestId('dcustom-veto-key').click()
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeFocused()
    await page.keyboard.press('PageDown')
    await expect(log).toHaveText('key:2024-04-10:ArrowRight,key:2024-04-10:PageDown')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await expect(page.getByTestId('dcustom-value')).toHaveText('None')
    await expect(page.getByTestId('dcustom-month')).toHaveText('2024-04')

    // Uncanceled control: the same gestures act once the veto lifts.
    await page.getByTestId('dcustom-veto-key').click()
    await page.getByTestId('dcustom-reset').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('button[data-date="2024-04-11"]')).toBeFocused()
  })

  test('CA-DAY-08: a Day whose date mismatches its render state diagnoses and renders non-interactive', async ({
    mount,
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('[reference-ui] Calendar:')) {
        errors.push(msg.text())
      }
    })
    await mount('components/Calendar/Calendar/DayViolations')

    await expect
      .poll(() => errors.filter((e) => e.includes('2024-04-10') && e.includes('2024-04-11')))
      .toHaveLength(1)
    expect(errors[0]).toContain('must exactly match')
    // No duplicate or misbound interactive cell: the 04-10 td has no
    // button while the real 04-11 keeps exactly one.
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(0)
    await expect(page.locator('button[data-date="2024-04-11"]')).toHaveCount(1)
    await expect(page.getByTestId('dviol-changes')).toHaveText('none')
    await expect(page.getByTestId('dviol-month-reqs')).toHaveText('none')

    // A noncanonical date mismatches the same way and never reaches the
    // availability predicate.
    await page.getByTestId('dviol-noncanonical').click()
    await expect
      .poll(() => errors.filter((e) => e.includes('2024-4-1')))
      .toHaveLength(1)
    const unavailCalls = await page.evaluate(
      () => (window as unknown as { __unavailCalls: string[] }).__unavailCalls
    )
    expect(unavailCalls).not.toContain('2024-4-1')
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(0)

    // Recovery: the valid renderer mounts the cell with no new diagnostic.
    const before = errors.length
    await page.getByTestId('dviol-valid').click()
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(1)
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('dviol-changes')).toHaveText('2024-04-10')
    expect(errors.length).toBe(before)
  })

  test('CA-DAY-09: a renderer returning no Day diagnoses the missing cell without partial grid state', async ({
    mount,
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('[reference-ui] Calendar:')) {
        errors.push(msg.text())
      }
    })
    await mount('components/Calendar/Calendar/DayViolations')
    await page.getByTestId('dviol-empty').click()

    await expect
      .poll(() =>
        errors.filter((e) => e.includes('2024-04-10') && e.includes('no element'))
      )
      .toHaveLength(1)
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(0)
    await expect(page.getByTestId('dviol-changes')).toHaveText('none')
    await expect(page.getByTestId('dviol-month-reqs')).toHaveText('none')
  })

  test('CA-DAY-10: a renderer returning multiple Days diagnoses without mounting duplicates', async ({
    mount,
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('[reference-ui] Calendar:')) {
        errors.push(msg.text())
      }
    })
    await mount('components/Calendar/Calendar/DayViolations')
    await page.getByTestId('dviol-multiple').click()

    await expect
      .poll(() =>
        errors.filter((e) => e.includes('2024-04-10') && e.includes('exactly one Day'))
      )
      .toHaveLength(1)
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(0)
    await expect(page.getByTestId('dviol-changes')).toHaveText('none')
    await expect(page.getByTestId('dviol-month-reqs')).toHaveText('none')
  })

  test('CA-DAY-11: a renderer returning a foreign element diagnoses without cloning managed props', async ({
    mount,
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('[reference-ui] Calendar:')) {
        errors.push(msg.text())
      }
    })
    await mount('components/Calendar/Calendar/DayViolations')

    await page.getByTestId('dviol-native').click()
    await expect
      .poll(() =>
        errors.filter((e) => e.includes('2024-04-10') && e.includes('native <button>'))
      )
      .toHaveLength(1)

    await page.getByTestId('dviol-wrapped').click()
    await expect
      .poll(() =>
        errors.filter((e) => e.includes('2024-04-10') && e.includes('native <span>'))
      )
      .toHaveLength(1)

    await page.getByTestId('dviol-component').click()
    await expect
      .poll(() =>
        errors.filter((e) => e.includes('2024-04-10') && e.includes('<ForeignDay>'))
      )
      .toHaveLength(1)

    // No substitute entered the grid: no foreign button, no managed
    // props cloned, no listeners or refs leaked, no callbacks.
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveCount(0)
    await expect(page.locator('[data-foreign-day]')).toHaveCount(0)
    await expect(page.getByTestId('dviol-changes')).toHaveText('none')
    await expect(page.getByTestId('dviol-month-reqs')).toHaveText('none')
  })

  test('CA-DAY-12: custom Day state and content refresh from latest props with stable node identity', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/DayCustom')

    await page.evaluate(() => {
      ;(window as unknown as { __april10?: Element | null }).__april10 =
        document.querySelector('button[data-date="2024-04-10"]')
    })
    // Locale, selection, and availability update together; the April 10
    // node survives with fresh state and managed attributes.
    await page.getByTestId('dcustom-locale').click()
    await page.getByTestId('dcustom-value-14').click()
    await page.getByTestId('dcustom-unavail').click()
    const sameNode = await page.evaluate(
      () =>
        document.querySelector('button[data-date="2024-04-10"]') ===
        (window as unknown as { __april10?: Element | null }).__april10
    )
    expect(sameNode).toBe(true)
    const day10Text = await page.locator('button[data-date="2024-04-10"]').innerText()
    expect(day10Text).not.toContain('10')
    expect(await stateOf(page, '2024-04-10')).toMatchObject({ selected: false })
    expect(await stateOf(page, '2024-04-14')).toMatchObject({
      selected: true,
      disabled: false,
    })
    expect(await stateOf(page, '2024-04-13')).toMatchObject({ disabled: true })
    expect(await stateOf(page, '2024-04-12')).toMatchObject({ disabled: false })
    await expect(page.locator('button[data-date="2024-04-14"]')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.locator('button[data-date="2024-04-13"]')).toHaveAttribute(
      'data-unavailable',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-12"]')).not.toHaveAttribute(
      'data-unavailable',
      ''
    )

    // The controlled month swaps the grid: May invokes only current
    // dates/data, the new event map applies, and the removed ref cleans up.
    await page.evaluate(() => {
      ;(window as unknown as { __dayStates: Record<string, unknown> }).__dayStates = {}
    })
    await page.getByTestId('dcustom-month').click()
    await page.getByTestId('dcustom-events').click()
    await expect(page.locator('button[data-date="2024-05-15"]')).toBeVisible()
    const recorded = await page.evaluate(
      () => Object.keys((window as unknown as { __dayStates: Record<string, unknown> }).__dayStates)
    )
    expect(recorded).toContain('2024-05-15')
    expect(recorded).not.toContain('2024-04-10')
    expect(recorded).not.toContain('2024-04-14')
    await expect(page.locator('[data-testid^="dcustom-dot-"]')).toHaveCount(0)
    const refLog = await page.evaluate(
      () => (window as unknown as { __refLog: string[] }).__refLog
    )
    expect(refLog[refLog.length - 1]).toBe('null')
  })
})

test.describe('Calendar range machine (FEATURES #9)', () => {
  test('CA-RANGE-01: the first enabled activation requests a controlled pending range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":null}'
    )
    // No optimistic selection before acceptance.
    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(0)

    await page.getByTestId('rmachine-accept').click()
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
  })

  test('CA-RANGE-02: hover and focus preview the pending interval with no callback', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    await page.locator('button[data-date="2024-04-15"]').hover()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    for (const d of ['2024-04-10', '2024-04-12', '2024-04-13', '2024-04-15']) {
      await expect(page.locator(`button[data-date="${d}"]`)).toHaveAttribute(
        'data-in-range',
        ''
      )
    }
    await expect(page.locator('button[data-date="2024-04-09"]')).not.toHaveAttribute(
      'data-in-range',
      ''
    )
    // Only the controlled start is selected; preview never is.
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(1)
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')

    // Hover clears; keyboard focus drives the next preview.
    await page.getByTestId('range-after').hover()
    await page.locator('button[data-date="2024-04-13"]').focus()
    await expect(page.locator('button[data-date="2024-04-13"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-15"]')).not.toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
  })

  test('CA-RANGE-03: pointer leave clears transient preview without touching the pending range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.locator('button[data-date="2024-04-15"]').hover()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )

    await page.getByTestId('range-after').hover()
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    for (const d of ['2024-04-11', '2024-04-13', '2024-04-15']) {
      await expect(page.locator(`button[data-date="${d}"]`)).not.toHaveAttribute(
        'data-in-range',
        ''
      )
    }
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
  })

  test('CA-RANGE-04: a later enabled day completes an inclusive chronological range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    await page.locator('button[data-date="2024-04-15"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-15"}'
    )
    await page.getByTestId('rmachine-accept').click()
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    for (const d of ['2024-04-10', '2024-04-11', '2024-04-13', '2024-04-15']) {
      await expect(page.locator(`button[data-date="${d}"]`)).toHaveAttribute(
        'data-in-range',
        ''
      )
      await expect(page.locator(`button[data-date="${d}"]`)).toHaveAttribute(
        'aria-selected',
        'true'
      )
    }
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(6)
    const preview = await page.evaluate(
      () =>
        (window as unknown as { __dayStates: Record<string, { preview: boolean }> })
          .__dayStates['2024-04-12'].preview
    )
    expect(preview).toBe(false)
  })

  test('CA-RANGE-05: a completion before the pending start normalizes to chronological endpoints', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-15').click()

    await page.locator('button[data-date="2024-04-10"]').hover()
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-15"}'
    )
    await page.getByTestId('rmachine-accept').click()
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-10"]')).not.toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:2024-04-15')
  })

  test('CA-RANGE-06: re-activating the pending start completes a one-day range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-10"}'
    )
    await page.getByTestId('rmachine-accept').click()
    const sole = page.locator('button[data-date="2024-04-10"]')
    await expect(sole).toHaveAttribute('data-range-start', '')
    await expect(sole).toHaveAttribute('data-range-end', '')
    await expect(sole).toHaveAttribute('data-in-range', '')
    await expect(sole).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2024-04-09"]')).not.toHaveAttribute(
      'data-in-range',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-11"]')).not.toHaveAttribute(
      'data-in-range',
      ''
    )

    // Keyboard leg: Enter on the pending start completes the same way.
    await page.getByTestId('rmachine-pending-10').click()
    await page.getByTestId('rmachine-clear').click()
    await page.locator('button[data-date="2024-04-10"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-10"}'
    )
  })

  test('CA-RANGE-07: a disabled endpoint or blocked crossing rejects with the pending start retained', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()
    await page.getByTestId('rmachine-block12').click()

    // Force bypasses the aria-disabled actionability gate: the attempt
    // itself must be silent (W-20 precedent).
    await page.locator('button[data-date="2024-04-12"]').click({ force: true })
    await page.locator('button[data-date="2024-04-15"]').click()
    await page.locator('button[data-date="2024-04-15"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    // Focus may move to the enabled candidate; nothing completes.
    await expect(page.locator('button[data-date="2024-04-15"]')).toBeFocused()

    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(1)
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
  })

  test('CA-RANGE-08: bounds and outside-month navigation apply to range preview and completion', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeBounds')

    // An out-of-bounds endpoint cannot preview.
    await page.locator('button[data-date="2024-10-04"]').hover({ force: true })
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)

    // An allowed endpoint previews inclusively.
    await page.locator('button[data-date="2024-09-30"]').hover()
    await expect(page.locator('button[data-date="2024-09-30"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(page.locator('button[data-date="2024-09-29"]')).toHaveAttribute(
      'data-in-range',
      ''
    )

    // Outside activation orders month before range, exactly once each.
    await page.locator('button[data-date="2024-10-01"]').click()
    await expect(page.getByTestId('rbounds-order')).toHaveText(
      'month:2024-10|change:2024-09-28:2024-10-01'
    )
    await page.getByTestId('rbounds-accept-month').click()
    await page.getByTestId('rbounds-accept').click()
    await expect(page.getByTestId('rbounds-value')).toHaveText('2024-09-28:2024-10-01')
    await expect(page.locator('button[data-date="2024-10-01"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
  })

  test('CA-RANGE-09: programmatic range values paint without emitting', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('range-after').click()

    await page.getByTestId('rmachine-completed').click()
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(6)

    await page.getByTestId('rmachine-pending-15').click()
    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date][data-in-range]')).toHaveCount(0)

    await page.getByTestId('rmachine-null').click()
    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(0)
    await expect(page.locator('button[data-date][data-range-start]')).toHaveCount(0)
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    await expect(page.getByTestId('rmachine-month-reqs')).toHaveText('none')
  })

  test('CA-RANGE-10: the first activation after a completed range starts a fresh pending range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-completed').click()

    await page.locator('button[data-date="2024-04-20"]').hover()
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(1)
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')

    await page.locator('button[data-date="2024-04-18"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-18","end":null}'
    )
    await page.getByTestId('rmachine-accept').click()
    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2024-04-18"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-10"]')).not.toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.locator('button[data-date][data-in-range]')).toHaveCount(0)
  })

  test('CA-RANGE-11: touch taps complete a range with no hover-only preview (synthetic tap path)', async ({
    mount,
    page,
  }) => {
    // The CT harness has no touch context, so taps are dispatched as
    // click events with no pointer movement — the tap path (activation
    // without hover) rather than a device gesture.
    await mount('components/Calendar/Calendar/RangeMachine')

    await page.dispatchEvent('button[data-date="2024-04-10"]', 'click')
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":null}'
    )
    // No hover preview exists between the taps.
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    await expect(page.locator('button[data-date][data-in-range]')).toHaveCount(0)

    await page.getByTestId('rmachine-accept').click()
    await page.dispatchEvent('button[data-date="2024-04-15"]', 'click')
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":null}|{"start":"2024-04-10","end":"2024-04-15"}'
    )
    // The roving target follows activation even without pointer focus.
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'tabindex',
      '0'
    )
    await page.getByTestId('rmachine-accept').click()
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(6)
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
  })

  test('CA-RANGE-12: rejected request stages leave no hidden range state', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')

    // A rejected first activation leaves no anchor: nothing previews.
    await page.locator('button[data-date="2024-04-10"]').click()
    await page.getByTestId('rmachine-reject').click()
    await expect(page.getByTestId('rmachine-value')).toHaveText('none')
    await page.locator('button[data-date="2024-04-15"]').hover()
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    await expect(page.locator('button[data-date][data-in-range]')).toHaveCount(0)

    // A rejected completion keeps the controlled anchor, which previews.
    await page.getByTestId('rmachine-pending-10').click()
    await page.locator('button[data-date="2024-04-15"]').click()
    await page.getByTestId('rmachine-reject').click()
    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(1)
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
    await page.locator('button[data-date="2024-04-15"]').hover()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )
  })

  test('CA-RANGE-13: a preview crossing an unavailable date paints no continuous range', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()
    await page.getByTestId('rmachine-block12').click()

    await page.locator('button[data-date="2024-04-15"]').hover()
    await expect(page.locator('button[data-date="2024-04-12"]')).toHaveAttribute(
      'data-unavailable',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-15"]')).not.toHaveAttribute(
      'data-range-end',
      ''
    )
    for (const d of ['2024-04-11', '2024-04-13', '2024-04-14', '2024-04-15']) {
      await expect(page.locator(`button[data-date="${d}"]`)).not.toHaveAttribute(
        'data-in-range',
        ''
      )
    }
    await expect(page.locator('button[data-date][aria-selected="true"]')).toHaveCount(1)
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')

    // The focus-driven preview is invalid the same way.
    await page.getByTestId('range-after').hover()
    await page.locator('button[data-date="2024-04-15"]').focus()
    await expect(page.locator('button[data-date="2024-04-15"]')).not.toHaveAttribute(
      'data-range-end',
      ''
    )
    await expect(page.locator('button[data-date="2024-04-14"]')).not.toHaveAttribute(
      'data-in-range',
      ''
    )
  })

  test('CA-RANGE-14: Tab leaving the grid commits a valid pending preview without preventing Tab', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()

    // Valid path: the request fires on keydown, native focus settles on
    // the next control, and the range paints only after acceptance.
    await page.locator('button[data-date="2024-04-15"]').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-15"}'
    )
    // P2 (F35 leg 1, DIAG D1 + SCOPE2 probe P-F35C): the origin day carries
    // roving tabindex -1 (roving never followed the programmatic focus; the
    // 0-stop stays 2024-04-03). Chromium Tabs forward out of the grid;
    // WebKit restarts at the first explicit-tabindex stop. The commit
    // assertions are the product contract and hold on both.
    if (engineOf() === 'webkit') {
      await expect(page.locator('button[data-date="2024-04-03"]')).toBeFocused()
    } else {
      await expect(page.getByTestId('rmachine-null')).toBeFocused()
    }
    await expect(page.locator('button[data-date="2024-04-15"]')).not.toHaveAttribute(
      'aria-selected',
      'true'
    )
    await page.getByTestId('rmachine-accept').click()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'aria-selected',
      'true'
    )

    // Invalid path: a blocked span emits nothing while Tab still moves.
    await page.getByTestId('rmachine-pending-10').click()
    await page.getByTestId('rmachine-block12').click()
    await page.getByTestId('rmachine-clear').click()
    await page.locator('button[data-date="2024-04-15"]').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    // P2 (F35 leg 2, same platform split as leg 1; probe P-F35C verified the
    // 0-stop and landing stay 2024-04-03 across all three legs on WebKit).
    if (engineOf() === 'webkit') {
      await expect(page.locator('button[data-date="2024-04-03"]')).toBeFocused()
    } else {
      await expect(page.getByTestId('rmachine-null')).toBeFocused()
    }

    // Rejected path: blur clears the transient band, the start stays.
    await page.getByTestId('rmachine-block12').click()
    await page.locator('button[data-date="2024-04-15"]').focus()
    await page.keyboard.press('Tab')
    // P1 (F35 leg 3): the rejected path needs grid blur to clear the transient
    // band; WebKit Tab stays in-grid (04-03 per the probe above), so move focus
    // out the way Chromium's Tab did — the blur-driven clear then runs
    // identically on both engines.
    if (engineOf() === 'webkit') await page.getByTestId('rmachine-null').focus()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-15"}'
    )
    await page.getByTestId('rmachine-reject').click()
    await expect(page.locator('button[data-date][data-range-end]')).toHaveCount(0)
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-selected',
      ''
    )
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
  })

  test('CA-RANGE-15: month navigation never completes a pending preview', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()
    await page.locator('button[data-date="2024-04-15"]').hover()

    const calendar = page.getByTestId('test-rmachine-calendar')
    await calendar.getByRole('button', { name: 'May 2024', exact: true }).click()
    await expect(page.getByTestId('rmachine-month-reqs')).toHaveText('2024-05')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    await page.getByTestId('rmachine-accept-month').click()
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.locator('button[data-date][data-selected]')).toHaveCount(0)

    // Previous leg in the May pane: preview, navigate back, still pending.
    await page.locator('button[data-date="2024-05-10"]').hover()
    await calendar.getByRole('button', { name: 'April 2024', exact: true }).click()
    await expect(page.getByTestId('rmachine-month-reqs')).toHaveText('2024-04')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    await page.getByTestId('rmachine-accept-month').click()
    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'data-range-start',
      ''
    )
  })

  test('CA-RANGE-16: month/year view navigation keeps the pending range intact and completable', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()
    await page.locator('button[data-date="2024-04-15"]').hover()

    const calendar = page.getByTestId('test-rmachine-calendar')
    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('rmachine-month-reqs')).toHaveText('2024-06')
    await page.getByTestId('rmachine-accept-month').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')

    await calendar.locator('[data-reference-calendar-year]').click()
    await calendar.locator('button[data-year="2025"]').click()
    await expect(page.getByTestId('rmachine-month-reqs')).toHaveText('2025-06')
    await page.getByTestId('rmachine-accept-month').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')

    await expect(page.getByTestId('rmachine-value')).toHaveText('2024-04-10:null')
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')

    // The same pending start still completes in the new pane.
    await page.locator('button[data-date="2025-06-05"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2025-06-05"}'
    )
  })
})

test.describe('Calendar view defaulting + environments (VIEW-13, DAY-14, ENV)', () => {
  test('CA-VIEW-13 (first fixture): a custom Days renderer keeps the default Header/Months/Years and drill-down', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/View13CustomDays')

    const calendar = page.getByTestId('test-v13-calendar')
    // Per-part defaulting: the authored Grid gains the default header.
    await expect(calendar.locator('[data-reference-calendar-month]')).toHaveCount(1)
    await expect(calendar.locator('[data-reference-calendar-year]')).toHaveCount(1)
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(page.getByTestId('v13-custom-2024-04-10')).toHaveText('custom-10')

    // Drill-down still works through the defaulted Months part.
    await calendar.locator('[data-reference-calendar-month]').click()
    await expect(calendar).toHaveAttribute('data-view', 'month')
    await expect(calendar.locator('button[data-month="2024-06"]')).toBeVisible()
    await calendar.locator('button[data-month="2024-06"]').click()
    await expect(page.getByTestId('v13-month-reqs')).toHaveText('2024-06')
    await page.getByTestId('v13-accept-month').click()
    await expect(calendar).toHaveAttribute('data-view', 'day')
    await expect(page.getByTestId('v13-custom-2024-06-01')).toHaveText('custom-1')
    await expect(page.getByTestId('v13-value')).toHaveText('2024-04-10')
  })

  test('CA-DAY-14: custom Days keep one button identity and one event default under StrictMode on every React version', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/StrictDays')

    // Exactly one DOM Day per ISO date despite renderer replay.
    const dateCounts = await page.evaluate(() => {
      const dates = [...document.querySelectorAll('button[data-date]')].map((b) =>
        b.getAttribute('data-date')
      )
      return { total: dates.length, unique: new Set(dates).size }
    })
    expect(dateCounts.total).toBeGreaterThan(0)
    expect(dateCounts.total).toBe(dateCounts.unique)

    const refIsButton = () =>
      page.evaluate(() => {
        const w = window as unknown as { __strictRef?: Element | null }
        return w.__strictRef === document.querySelector('button[data-date="2024-04-10"]')
      })
    expect(await refIsButton()).toBe(true)

    // A no-op rerender keeps the exact node: no loop, no stale registration.
    await page.getByTestId('strict-bump').click()
    expect(await refIsButton()).toBe(true)

    // One activation: one consumer event, one controlled request.
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('strict-consumer')).toHaveText('1')
    await expect(page.getByTestId('strict-changes')).toHaveText('2024-04-10')
  })

  test('CA-ENV-03: focus, labels, announcements, and preview work inside an open ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ShadowRange')

    const shadowActiveDate = () =>
      page.evaluate(() => {
        const host = document.querySelector('[data-testid="shadow-host"]')!
        const active = host.shadowRoot!.activeElement
        return active?.getAttribute?.('data-date') ?? null
      })

    // Tab enters the shadow tree (the document sees only the host) and
    // reaches the grid's pending-start tab stop through the header.
    await page.getByTestId('shadow-before').click()
    await page.keyboard.press('Tab')
    const hostFocused = await page.evaluate(
      () =>
        document.activeElement?.getAttribute('data-testid') === 'shadow-host'
    )
    expect(hostFocused).toBe(true)
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')
    expect(await shadowActiveDate()).toBe('2024-04-10')

    // Arrow movement stays inside the root.
    await page.keyboard.press('ArrowRight')
    expect(await shadowActiveDate()).toBe('2024-04-11')

    // Full accessible labels resolve locally.
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'aria-label',
      'Wednesday, 10 April 2024'
    )

    // Hover previews the pending interval across the shadow boundary.
    await page.locator('button[data-date="2024-04-15"]').hover()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )

    // Cross-month keyboard focus waits for the controlled month, then
    // lands once with exactly one live heading mutation (CA-VIEW-11 count).
    await page.locator('button[data-date="2024-04-30"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('shadow-month-reqs')).toHaveText('2024-05')
    expect(await shadowActiveDate()).toBe('2024-04-30')
    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]')!
      const node = host.shadowRoot!.querySelector('[data-reference-calendar-heading]')!
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
    await page.getByTestId('shadow-accept-month').click()
    expect(await shadowActiveDate()).toBe('2024-05-01')
    expect(
      await page.evaluate(
        () => (window as unknown as { __headingMutations: number }).__headingMutations
      )
    ).toBe(1)

    // Day ids are unique inside the root and invisible to the document.
    const idCheck = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]')!
      const ids = [...host.shadowRoot!.querySelectorAll('[id]')].map((el) => el.id)
      return {
        unique: new Set(ids).size === ids.length,
        documentSeesFirst: document.getElementById(ids[0]) !== null,
      }
    })
    expect(idCheck).toEqual({ unique: true, documentSeesFirst: false })
  })

  test('CA-ENV-04: public date behavior is identical across engines (chromium proof; others unrun)', async ({
    mount,
    page,
  }) => {
    // Honest scope: the CT harness runs Desktop Chrome only — there is no
    // Firefox/WebKit project — so this pins the cross-engine vectors on
    // chromium. Identical Firefox/WebKit behavior is NOT proven here.

    // en-GB grid shape + full date names.
    await mount('components/Calendar/Calendar/BritishGrid')
    await expect(page.getByTestId('gb-grid').locator('th').first()).toHaveText('Mon')
    const gbName = await page
      .locator('button[data-date="2024-09-18"]')
      .getAttribute('aria-label')
    expect(gbName).toContain('September')

    // Bounded arrow movement stops without wrapping.
    await mount('components/Calendar/Calendar/Constrained')
    await page.locator('button[data-date="2024-04-05"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('button[data-date="2024-04-05"]')).toBeFocused()

    // Outside-month callback ordering.
    await mount('components/Calendar/Calendar/OutsideMonth')
    await page.locator('button[data-date="2024-10-01"]').click()
    await expect(page.getByTestId('out-events')).toHaveText('m:2024-10,c:2024-10-01')

    // Single activation emits its canonical ISO once.
    await mount('components/Calendar/Calendar/EmissionCounter')
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('emit-log')).toHaveText('2024-04-10')

    // Pending/completed range with an unavailable crossing rejected.
    await mount('components/Calendar/Calendar/RangeMachine')
    await page.getByTestId('rmachine-pending-10').click()
    await page.getByTestId('rmachine-block12').click()
    await page.locator('button[data-date="2024-04-15"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText('none')
    await page.getByTestId('rmachine-block12').click()
    await page.locator('button[data-date="2024-04-15"]').click()
    await expect(page.getByTestId('rmachine-requests')).toHaveText(
      '{"start":"2024-04-10","end":"2024-04-15"}'
    )

    // Live month update announces through the stable Heading.
    await mount('components/Calendar/Calendar/MonthMachine')
    await page.getByTestId('month-next').click()
    await page.getByTestId('month-accept').click()
    await expect(page.getByTestId('month-heading')).toHaveText('February 2024')
  })
})
