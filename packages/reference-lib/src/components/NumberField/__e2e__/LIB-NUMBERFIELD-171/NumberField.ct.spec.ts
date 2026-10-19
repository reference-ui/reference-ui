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
  test('NF-EDIT-15: Deletion around grouping and affixes preserves a correct editable buffer', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await input.click()
    await input.fill('1,024')
    await expect(log).toHaveText('log: 1024')
    await expect(display).toHaveText('Value: 1024')
    // Deleting the group separator keeps the native buffer; the meaning
    // is unchanged, so no new request publishes.
    await expect(caret()).resolves.toEqual([5, 5])
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Backspace')
    await expect(input).toHaveValue('1024')
    await expect(caret()).resolves.toEqual([1, 1])
    await expect(log).toHaveText('log: 1024')
    // Deleting the first digit orphans the head separator: the partial
    // stays natively editable with no spurious request, and commit takes
    // the unambiguous remainder.
    await input.fill('1,024')
    await expect(log).toHaveText('log: 1024')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Backspace')
    await expect(input).toHaveValue(',024')
    await expect(caret()).resolves.toEqual([0, 0])
    await expect(log).toHaveText('log: 1024')
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('log: 1024,24')
    await expect(display).toHaveText('Value: 24')
    await expect(input).toHaveValue('24')
    // Affix and decimal tokens delete natively; only new meanings publish.
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    const currencyDisplay = page.getByTestId('currency-display')
    await currency.click()
    // Portable caret-to-start (bare Home is a caret no-op on
    // FF/WebKit macOS builds) — select-all + ArrowLeft collapse, then
    // select the individual currency token. Same SPEC step as Home.
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Backspace')
    await expect(currency).toHaveValue('1,234.50')
    await expect(currencyDisplay).toHaveText('Currency Value: 1234.5')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Backspace')
    await expect(currency).toHaveValue('1234.50')
    await expect(currencyDisplay).toHaveText('Currency Value: 1234.5')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Backspace')
    await expect(currency).toHaveValue('123450')
    await expect(currencyDisplay).toHaveText('Currency Value: 123450')
  })
});
