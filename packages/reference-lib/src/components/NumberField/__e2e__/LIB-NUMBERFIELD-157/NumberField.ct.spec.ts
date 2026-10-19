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
  test('NF-EDIT-01: Focusing null and formatted fields leaves them clean', async ({ mount, page }) => {
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    await currency.click()
    await expect(currency).toHaveValue('$1,234.50')
    await expect(currency).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('currency-display')).toHaveText('Currency Value: 1234.5')

    await mount('components/NumberField/NumberField/BoundedDecimalFixture')
    const empty = page.getByTestId('bounded-decimal-input')
    await empty.click()
    await expect(empty).toHaveValue('')
    await expect(empty).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('bounded-decimal-log')).toHaveText('requests: 0')
  })
});
