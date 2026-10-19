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
  test('NF-COMMIT-06: Validate commit should retain accepted invalid numbers without touching native text-input range/step validity', async ({
    mount,
    page,
  }) => {
    // Replaces the earlier validate-revert title.
    await mount('components/NumberField/NumberField/ValidateFixture')

    const input = page.getByTestId('validate-input')
    const display = page.getByTestId('validate-display')
    const log = page.getByTestId('validate-log')
    const hidden = page.locator('input[type="hidden"]')

    async function nativeValidity() {
      return input.evaluate(el => {
        const target = el as HTMLInputElement
        const validity = target.validity
        return {
          rangeUnderflow: validity.rangeUnderflow,
          rangeOverflow: validity.rangeOverflow,
          stepMismatch: validity.stepMismatch,
          customError: validity.customError,
          message: target.validationMessage,
        }
      })
    }
    const cleanNative = {
      rangeUnderflow: false,
      rangeOverflow: false,
      stepMismatch: false,
      customError: false,
      message: '',
    }

    // The fixture accepts immediately, so every invalid value lands via
    // live request and each Enter is a retaining no-op — which is exactly
    // the freeze's "accepted invalid numbers" path. No commit-request ever
    // fires, so the advisory log stays quiet (advisory itself is proven in
    // unit NF-MATH-13, where the commit path actually requests).
    await expect(input).toHaveValue('5')
    // Off-step mismatch retained with managed invalid state, native clean.
    await input.fill('2.5')
    await expect(display).toHaveText('Validate Value: 2.5')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Validate Value: 2.5')
    await expect(hidden).toHaveValue('2.5')
    await expect(log).toHaveText('invalid: none')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute('data-invalid', '')
    expect(await nativeValidity()).toEqual(cleanNative)

    // Overflow retained, never clamped.
    await input.fill('25')
    await expect(display).toHaveText('Validate Value: 25')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('25')
    await expect(display).toHaveText('Validate Value: 25')
    await expect(hidden).toHaveValue('25')
    await expect(log).toHaveText('invalid: none')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(await nativeValidity()).toEqual(cleanNative)

    // Underflow retained, never clamped.
    await input.fill('-5')
    await expect(display).toHaveText('Validate Value: -5')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('-5')
    await expect(display).toHaveText('Validate Value: -5')
    await expect(hidden).toHaveValue('-5')
    await expect(log).toHaveText('invalid: none')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(await nativeValidity()).toEqual(cleanNative)

    // A valid commit clears managed invalid state without advisory noise.
    await input.fill('7')
    await expect(display).toHaveText('Validate Value: 7')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('7')
    await expect(display).toHaveText('Validate Value: 7')
    await expect(hidden).toHaveValue('7')
    await expect(log).toHaveText('invalid: none')
    await expect(input).not.toHaveAttribute('data-invalid')
    await expect(input).not.toHaveAttribute('aria-invalid')
  })
});
