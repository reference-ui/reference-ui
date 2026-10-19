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
  test('NF-FORM-09: Autofill-equivalent input/change events follow ordinary public edit and commit rules', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const hidden = page.locator('input[name="qty"]')
    await input.click()
    const focusedTag = await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '42')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new Event('change', { bubbles: true }))
      const active = target.ownerDocument.activeElement
      return active === target ? 'input' : active?.tagName ?? 'none'
    })
    expect(focusedTag).toBe('input')
    await expect(input).toHaveValue('42')
    // Autofill travels the live path: the input event publishes
    // immediately (echo on), so the log shows 42 pre-blur.
    await expect(log).toHaveText('log: 42')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 42')
    await expect(display).toHaveText('Value: 42')
    await expect(hidden).toHaveValue('42')
    // Reject run: callbacks fire, controlled/hidden state stays prop-based.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '43')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await page.getByTestId('commit-lab-outside').click()
    // Echo off: live 43 publishes, blur retries it; nothing sticks.
    await expect(log).toHaveText('log: 42,43,43')
    await expect(display).toHaveText('Value: 42')
    await expect(hidden).toHaveValue('42')
  })
});
