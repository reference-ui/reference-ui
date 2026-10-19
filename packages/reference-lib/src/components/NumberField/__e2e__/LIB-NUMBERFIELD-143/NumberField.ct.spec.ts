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
  test('NF-EDIT-03: Newly parseable live edits request numbers while preserving authored text and caret', async ({
    mount,
    page,
  }) => {
    // Repro: true per-keystroke
    // typing into the empty bounded (min 1, max 10) field. The "."
    // survives verbatim; parseable meanings publish live.
    await mount('components/NumberField/NumberField/BoundedDecimalFixture')

    const input = page.getByTestId('bounded-decimal-input')
    const display = page.getByTestId('bounded-decimal-display')
    const log = page.getByTestId('bounded-decimal-log')

    await input.click()
    await input.pressSequentially('2.5', { delay: 20 })
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Decimal Value: 2.5')
    await expect(log).toHaveText('requests: 2')
    await expect(input).toHaveAttribute('data-editing', '')
    const caret = await input.evaluate(el => {
      const target = el as HTMLInputElement
      return [target.selectionStart, target.selectionEnd]
    })
    expect(caret).toEqual([3, 3])
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('2.5')
    await expect(input).not.toHaveAttribute('data-editing')
    await expect(display).toHaveText('Decimal Value: 2.5')
    await expect(log).toHaveText('requests: 2')
  })
});
