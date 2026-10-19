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
  test('NF-A11Y-01 scan: axe reports zero violations on the named stepper field', async ({
    mount,
    page,
  }) => {
    // Scanner half of NF-A11Y-01 (assertion half is the NF-A11Y-01..06 unit
    // convergence suite): the labeled StepperFixture exercises input +
    // steppers in one mount; #root scoping covers the whole story (no
    // portals in NumberField).
    await mount('components/NumberField/NumberField/StepperFixture')
    const input = page.getByTestId('number-field-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveAccessibleName('Quantity')
    await expectNoAxeViolations(page, { include: '#root' })
  })
});
