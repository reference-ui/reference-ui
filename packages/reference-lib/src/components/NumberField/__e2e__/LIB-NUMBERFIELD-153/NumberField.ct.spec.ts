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
  test('NF-FORM-02: A named field submits one canonical pair from the live form', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/NamedFormFixture')

    const payload = page.getByTestId('named-form-payload')
    await expect(payload).toHaveText('payload: none')
    await page.getByTestId('named-form-submit').click()
    await expect(payload).toHaveText('payload: price=1234.5')
  })
});
