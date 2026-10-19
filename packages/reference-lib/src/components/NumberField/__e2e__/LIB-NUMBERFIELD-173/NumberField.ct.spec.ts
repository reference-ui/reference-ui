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
  test('NF-EDIT-17: A controlled value change during active composition invalidates the session and ignores stale fallout', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await input.click()
    await page.keyboard.press('ControlOrMeta+a')
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('ni3hao')
    await expect(log).toHaveText('log: none')
    // Programmatic replacement lands without blur: latest formatted text,
    // editing cleared, selection at the formatted end.
    await page.getByTestId('commit-lab-set-99').click()
    await expect(input).toHaveValue('99')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(caret()).resolves.toEqual([2, 2])
    await expect(display).toHaveText('Value: 99')
    await expect(log).toHaveText('log: none')
    await expect(input).toBeFocused()
    // Stale compositionend + matching input fallout: ignored, DOM text
    // reverts to controlled, zero callback.
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao!')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('99')
    await expect(log).toHaveText('log: none')
    await expect(display).toHaveText('Value: 99')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: none')
  })
});
