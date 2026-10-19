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
  test('NF-FORM-14: Clicked reset applies blur first and cancellation preserves post-blur state', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const display = page.getByTestId('commit-lab-display')
    const log = page.getByTestId('commit-lab-log')
    const order = page.getByTestId('commit-lab-order')
    const hidden = page.locator('input[name="qty"]')
    // Accepted run: live 50 lands at fill (echo on); the reset click
    // blurs first (veto-check, no retry), reset clears transient.
    await input.click()
    await input.fill('50')
    await page.getByTestId('commit-lab-reset').click()
    await expect(order).toHaveText('order: request,blur')
    await expect(log).toHaveText('log: 50')
    await expect(display).toHaveText('Value: 50')
    await expect(input).toHaveValue('50')
    await expect(input).not.toHaveAttribute('data-editing', '')
    // Rejected run: live 60 publishes, the blur-first retry re-requests
    // it, reset clears pending around authority.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.fill('60')
    await page.getByTestId('commit-lab-reset').click()
    await expect(log).toHaveText('log: 50,60,60')
    await expect(display).toHaveText('Value: 50')
    await expect(input).toHaveValue('50')
    await expect(hidden).toHaveValue('50')
    // Incomplete run: blur records the boundary, reset clears it.
    await input.click()
    await input.fill('-')
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).toHaveValue('50')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(log).toHaveText('log: 50,60,60')
    // Canceled run: an application capture-cancel preserves the post-blur
    // failed state and no old dirty text returns.
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="commit-lab-form"]') as HTMLFormElement
      const cancel = (e: Event) => e.preventDefault()
      ;(window as unknown as { __nfCancelReset: (e: Event) => void }).__nfCancelReset = cancel
      form.addEventListener('reset', cancel, true)
    })
    await input.click()
    await input.fill('-')
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveValue('50')
    await expect(input).not.toHaveAttribute('data-editing', '')
    // Removing the cancel lets an unprevented reset clear the boundary.
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="commit-lab-form"]') as HTMLFormElement
      form.removeEventListener(
        'reset',
        (window as unknown as { __nfCancelReset: (e: Event) => void }).__nfCancelReset,
        true
      )
    })
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveValue('50')
    await expect(display).toHaveText('Value: 50')
  })
});
