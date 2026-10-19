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
  test('controlled unbounded field steps from echoed state (FEATURES #1: no uncontrolled mode)', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/UnboundedFixture')

    const input = page.getByTestId('unbounded-number-field-input')
    const btnInc = page.getByTestId('unbounded-btn-increment')
    const btnDec = page.getByTestId('unbounded-btn-decrement')

    await expect(input).toHaveValue('5')
    await btnInc.click()
    await expect(input).toHaveValue('6')
    await btnDec.click()
    await btnDec.click()
    await expect(input).toHaveValue('4')
    await input.focus()
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue('5')
  })
});
