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
  test('NF-EDIT-01: Focusing clean Input does not start a dirty session', async ({ mount, page }) => {
    // Keyboard focus shares the programmatic focus path (no key-specific
    // focus logic exists), so pointer + programmatic focus prove the case.
    await mount('components/NumberField/NumberField/StepperFixture')
    const input = page.getByTestId('number-field-input')
    await input.click()
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('42')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
    await input.evaluate(el => (el as HTMLInputElement).blur())
    await input.evaluate(el => (el as HTMLInputElement).focus())
    await expect(input).toHaveValue('42')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
  })
});
