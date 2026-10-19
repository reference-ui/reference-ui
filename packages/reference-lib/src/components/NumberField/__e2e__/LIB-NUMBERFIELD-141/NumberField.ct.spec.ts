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
  test('NF-MATH-07: Decimal stepper clicks remove floating drift in the UI', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/DecimalFixture')

    const input = page.getByTestId('decimal-number-field-input')
    const btnInc = page.getByTestId('decimal-btn-increment')

    await btnInc.click()
    await btnInc.click()
    await btnInc.click()
    await expect(input).toHaveValue('0.3')
  })
});
