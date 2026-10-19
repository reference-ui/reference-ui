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
  test('NF-STEP-01: Named steppers control the real Input without adding a tab stop', async ({
    mount,
    page,
  }) => {
    // freeze-name proof — label/labelledby variants with exact
    // authored names under two locales, native button semantics, stepping
    // control, no tab stop. Resolving aria-controls + explicit/generated IDs
    // stay with NF-DOM-07 (same-commit retargeting).
    await mount('components/NumberField/NumberField/NamedStepperFixture')

    const inputEn = page.getByTestId('named-en-input')
    const btnIncEn = page.getByTestId('named-en-inc')
    const btnDecEn = page.getByTestId('named-en-dec')
    const inputDe = page.getByTestId('named-de-input')
    const btnIncDe = page.getByTestId('named-de-inc')
    const btnDecDe = page.getByTestId('named-de-dec')

    // Exact authored names on both variants; identical under de-DE —
    // locale changes never translate or replace authored names.
    await expect(btnDecEn).toHaveAttribute('aria-label', 'Decrease quantity')
    await expect(btnIncEn).toHaveAttribute('aria-labelledby', 'named-en-inc-label')
    await expect(btnIncEn).toHaveAccessibleName('Increase quantity')
    await expect(btnDecDe).toHaveAttribute('aria-label', 'Decrease quantity')
    await expect(btnIncDe).toHaveAttribute('aria-labelledby', 'named-de-inc-label')
    await expect(btnIncDe).toHaveAccessibleName('Increase quantity')
    await expect(page.getByTestId('named-en-field').getByRole('button', { name: 'Decrease quantity' })).toBeVisible()
    await expect(page.getByTestId('named-de-field').getByRole('button', { name: 'Increase quantity' })).toBeVisible()

    // Native button role/type, no tab stop.
    for (const btn of [btnIncEn, btnDecEn, btnIncDe, btnDecDe]) {
      await expect(btn).toHaveAttribute('tabindex', '-1')
      await expect(btn).toHaveAttribute('type', 'button')
    }

    // Named steppers control the real Input.
    await btnIncEn.click()
    await expect(inputEn).toHaveValue('43')
    await btnDecEn.click()
    await expect(inputEn).toHaveValue('42')
    await btnIncDe.click()
    await expect(inputDe).toHaveValue('43')

    // Tab reaches the single Input stop, then leaves past the steppers.
    await inputEn.evaluate(node => {
      const btn = document.createElement('button')
      btn.id = '__test_tab_shim__'
      btn.textContent = 'shim'
      node.parentNode?.insertBefore(btn, node)
      btn.focus()
    })
    await page.keyboard.press('Tab')
    await expect(inputEn).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(inputEn).not.toBeFocused()
    await expect(btnIncEn).not.toBeFocused()
    await expect(btnDecEn).not.toBeFocused()
    await page.locator('#__test_tab_shim__').evaluate(btn => btn?.remove()).catch(() => {})
  })
});
