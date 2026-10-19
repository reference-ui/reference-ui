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
  test('NF-DOM-02: A name adds only one direct canonical hidden form input', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/NamedFormFixture')

    const host = page.getByTestId('named-form-field')
    const input = page.getByTestId('named-form-input')

    // Exactly one root-direct hidden input with canonical text.
    const hiddenCount = await host.evaluate(
      el => el.querySelectorAll(':scope > input[type="hidden"]').length
    )
    expect(hiddenCount).toBe(1)
    const hidden = host.locator(':scope > input[type="hidden"]')
    await expect(hidden).toHaveAttribute('name', 'price')
    await expect(hidden).toHaveValue('1234.5')

    // Visible Input shows localized text and carries no name.
    await expect(input).toHaveValue('$1,234.50')
    await expect(input).not.toHaveAttribute('name')
  })
});
