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
  test('NF-EDIT-12: A valid synthetic composition result parses once and an invalid result restores pre-composition text', async ({
    mount,
    page,
  }) => {
    const lab = await mount('components/NumberField/NumberField/CompositionFixture')
    const input = page.getByTestId('composition-input')
    const log = page.getByTestId('composition-log')
    const display = page.getByTestId('composition-display')
    await input.click()
    // Valid localized final: compositionend publishes nothing itself,
    // the matching post-end input publishes no duplicate, and the blur
    // boundary requests the staged final exactly once.
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, '١٢')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
    })
    await expect(log).toHaveText('log: none')
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '١٢')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    // Matching post-end input: no duplicate request.
    await expect(log).toHaveText('log: none')
    await page.getByTestId('composition-outside').click()
    await expect(log).toHaveText('log: 12')
    await expect(display).toHaveText('Value: 12')
    // Invalid prose final restores pre-composition text at compositionend
    // with no request and no stale text at the next boundary either.
    await lab.unmount()
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const inputB = page.getByTestId('commit-lab-input')
    await inputB.click()
    await inputB.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
    })
    await expect(inputB).toHaveValue('5')
    await expect(inputB).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    await page.getByTestId('commit-lab-outside').click()
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 5')
  })
});
