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
  test('NF-FORMAT-04: An effective format change replaces dirty text from controlled state', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/FormatSwapFixture')

    const input = page.getByTestId('format-swap-input')
    const log = page.getByTestId('format-swap-log')
    const hidden = page.locator('input[name="price"]')
    await input.click()
    await input.fill('999')
    await expect(input).toHaveAttribute('data-editing', '')
    // Live request lands immediately (echo on); the EUR swap replaces
    // dirty text from controlled 999, not the pre-edit 1234.5.
    await expect(log).toHaveText('log: 999')
    await page.getByTestId('format-swap-eur').click()
    await expect(input).toHaveValue('€999.00')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(hidden).toHaveValue('999')
    await expect(log).toHaveText('log: 999')
    await expect(input).toBeFocused()
  })
});
