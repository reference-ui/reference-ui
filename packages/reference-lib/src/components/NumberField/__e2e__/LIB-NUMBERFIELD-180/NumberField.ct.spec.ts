/**
 * NumberField browser proof: anatomy, keys, editing, commit, and forms.
 * Mounts the story fixtures to pin the single-root DOM shape, stepping
 * and coarse deltas, native-preserving edits (caret, paste, composition,
 * IME), commit policies, locale parsing and formatting, form submit and
 * reset, Shadow DOM scoping, and an axe-clean scan.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

// Real-paste helpers (probed headless-green on Chromium/Firefox/WebKit
// 2026-09-28): stagePaste copies with focus outside the field — the prep
// blur noops on echoed/in-range drafts — then refocuses; callers pin the
// caret portably (select-all + arrow collapse, never Home) and press
// ControlOrMeta+v.

test.describe('NumberField CT', () => {
  test('NF-EDIT-07: Focused formatting replacements preserve the caret by logical digit with a documented end fallback', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CaretLabFixture')
    const input = page.getByTestId('caret-input')
    const currency = page.getByTestId('caret-currency-input')
    const percent = page.getByTestId('caret-percent-input')
    const caretOf = (target: typeof input) => () =>
      target.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    const caret = caretOf(input)
    const place = (target: typeof input, start: number, end: number) =>
      target.evaluate(
        (el, [s, e]) => (el as HTMLInputElement).setSelectionRange(s, e),
        [start, end] as [number, number]
      )
    await expect(input).toHaveValue('1,234')
    // Start anchor: no preceding digit stays at text start.
    await input.click()
    await place(input, 0, 0)
    await page.getByTestId('caret-set-12345').click()
    await expect(input).toHaveValue('12,345')
    await expect(caret()).resolves.toEqual([0, 0])
    await expect(input).toBeFocused()
    // Middle insertion across a shifted group separator: 2 digits before
    // stays after the 2nd digit.
    await page.getByTestId('caret-set-1234').click()
    await expect(input).toHaveValue('1,234')
    await place(input, 3, 3)
    await page.getByTestId('caret-set-12345').click()
    await expect(input).toHaveValue('12,345')
    await expect(caret()).resolves.toEqual([2, 2])
    // Deeper middle: 3 digits before lands after the 3rd digit.
    await page.getByTestId('caret-set-1234').click()
    await place(input, 4, 4)
    await page.getByTestId('caret-set-12345').click()
    await expect(input).toHaveValue('12,345')
    await expect(caret()).resolves.toEqual([4, 4])
    // Ranged logical selection: each edge follows its own digit count.
    await page.getByTestId('caret-set-1234').click()
    await place(input, 1, 4)
    await page.getByTestId('caret-set-12345').click()
    await expect(input).toHaveValue('12,345')
    await expect(caret()).resolves.toEqual([1, 4])
    // Deletion past the digit supply clamps to the documented end fallback.
    await place(input, 6, 6)
    await page.getByTestId('caret-set-123').click()
    await expect(input).toHaveValue('123')
    await expect(caret()).resolves.toEqual([3, 3])
    // Currency prefix: end-of-cents follows its 6 digits, not the new end.
    await expect(currency).toHaveValue('$1,234.50')
    const currencyCaret = caretOf(currency)
    await currency.click()
    await place(currency, 9, 9)
    await page.getByTestId('caret-currency-set').click()
    await expect(currency).toHaveValue('$12,345.67')
    await expect(currencyCaret()).resolves.toEqual([9, 9])
    await expect(currency).toBeFocused()
    // Currency start anchors before the prefix.
    await page.getByTestId('caret-currency-reset').click()
    await expect(currency).toHaveValue('$1,234.50')
    await place(currency, 0, 0)
    await page.getByTestId('caret-currency-set').click()
    await expect(currency).toHaveValue('$12,345.67')
    await expect(currencyCaret()).resolves.toEqual([0, 0])
    // Percent suffix: end clamps when the digit supply shrinks.
    await expect(percent).toHaveValue('13%')
    const percentCaret = caretOf(percent)
    await percent.click()
    await place(percent, 3, 3)
    await page.getByTestId('caret-percent-set').click()
    await expect(percent).toHaveValue('5%')
    await expect(percentCaret()).resolves.toEqual([2, 2])
    await expect(percent).toBeFocused()
    await page.getByTestId('caret-percent-reset').click()
    await expect(percent).toHaveValue('13%')
    await place(percent, 0, 0)
    await page.getByTestId('caret-percent-set').click()
    await expect(percent).toHaveValue('5%')
    await expect(percentCaret()).resolves.toEqual([0, 0])
  })
});
