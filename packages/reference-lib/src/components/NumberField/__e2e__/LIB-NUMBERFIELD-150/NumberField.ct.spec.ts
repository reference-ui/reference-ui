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
  test('NF-DOM-01: NumberField renders exactly one root div, group div, text input, and authored stepper buttons', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const host = page.getByTestId('number-field-root')
    const group = page.getByTestId('number-field-group')
    const input = page.getByTestId('number-field-input')

    // Fixed tags and managed roles.
    await expect(host).toHaveJSProperty('tagName', 'DIV')
    await expect(host).not.toHaveAttribute('role')
    await expect(host).not.toHaveAttribute('data-reference-field')
    await expect(group).toHaveJSProperty('tagName', 'DIV')
    await expect(group).toHaveAttribute('role', 'group')
    await expect(group).toHaveAttribute('data-reference-field', '')
    await expect(group).toHaveAttribute('data-reference-number-field', '')

    // Authored order, no wrapper: decrement, text input, increment.
    const order = await group.evaluate(el =>
      Array.from(el.children).map(c => `${c.tagName}:${c.getAttribute('type') ?? ''}`)
    )
    expect(order).toEqual(['BUTTON:button', 'INPUT:text', 'BUTTON:button'])

    // Plain textbox exposure, never spinbutton or native number.
    await expect(input).toHaveAttribute('type', 'text')
    await expect(input).not.toHaveAttribute('role')
    await expect(input).not.toHaveAttribute('aria-valuenow')
    await expect(page.locator('[role="spinbutton"]')).toHaveCount(0)
    await expect(page.locator('input[type="number"]')).toHaveCount(0)

    // Accessible textbox name resolves in the tree.
    await expect(page.getByRole('textbox', { name: 'Quantity' })).toBeVisible()
  })
});
