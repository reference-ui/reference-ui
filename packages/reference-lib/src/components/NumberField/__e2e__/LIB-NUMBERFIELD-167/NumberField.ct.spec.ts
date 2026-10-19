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
  test('NF-FORM-11: Clicking submit from dirty partial or unaccepted complete blocks stale serialization', async ({
    mount,
    page,
  }) => {
    // Submit probe: registered after the engine listener, so
    // defaultPrevented reflects engine blocking, and qty shows the hidden
    // value that would have serialized.
    const installProbe = () =>
      page.evaluate(() => {
        const form = document.querySelector('[data-testid="commit-lab-form"]') as HTMLFormElement
        ;(
          window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> }
        ).__nfSubmits = []
        form.addEventListener('submit', e => {
          ;(
            window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> }
          ).__nfSubmits.push({
            prevented: e.defaultPrevented,
            qty: new FormData(form).get('qty') as string | null,
          })
        })
      })
    const probe = () =>
      page.evaluate(
        () =>
          (window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> })
            .__nfSubmits
      )
    // Run A: incomplete partial, echo on. Blur runs first (consumer blur,
    // failed commit, no request), the ensuing submit is prevented, and the
    // old hidden value never escapes.
    const lab = await mount('components/NumberField/NumberField/CommitLabFixture')
    await installProbe()
    const input = page.getByTestId('commit-lab-input')
    const hidden = page.locator('input[name="qty"]')
    const submits = page.getByTestId('commit-lab-submits')
    await input.click()
    await input.fill('-')
    await page.getByTestId('commit-lab-submit').click()
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: blur')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    await expect(input).toHaveValue('5')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(hidden).toHaveValue('5')
    await expect.poll(async () => (await probe()).length).toBe(1)
    expect(await probe()).toEqual([{ prevented: true, qty: '5' }])
    // The fixture counts delivered submit events (its React handler runs
    // regardless of prevention); the probe's prevented flag is the blocking
    // signal.
    await expect(submits).toHaveText('submits: 1')
    // Repeated click attempts remain blocked without consuming failed state.
    await page.getByTestId('commit-lab-submit').click()
    await page.getByTestId('commit-lab-submit').click()
    await expect.poll(async () => (await probe()).length).toBe(3)
    await expect(submits).toHaveText('submits: 3')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    expect(await probe()).toEqual([
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
    ])
    // Resolution: a subsequent valid user edit clears the boundary, the
    // accepted commit lands, and the next click submits canonically.
    await input.click()
    await input.fill('7')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await page.getByTestId('commit-lab-outside').click()
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 7')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 7')
    await page.getByTestId('commit-lab-submit').click()
    await expect(submits).toHaveText('submits: 4')
    await expect.poll(async () => (await probe()).length).toBe(4)
    expect(await probe()).toEqual([
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
      { prevented: false, qty: '7' },
    ])
    // Run B: complete but unaccepted (echo off) — blur-first request, then
    // pending-blocked submit and retries; an unprevented reset clears the
    // boundary and a later accepted commit submits.
    await lab.unmount()
    await mount('components/NumberField/NumberField/CommitLabFixture')
    await installProbe()
    const inputB = page.getByTestId('commit-lab-input')
    const submitsB = page.getByTestId('commit-lab-submits')
    await page.getByTestId('commit-lab-echo-off').click()
    await inputB.click()
    await inputB.fill('8')
    // Echo off: live 8 publishes at fill, the submit click blurs first
    // and retries it, then the submit is pending-blocked.
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 8')
    await page.getByTestId('commit-lab-submit').click()
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: request,blur,request')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 8,8')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 5')
    await expect.poll(async () => (await probe()).length).toBe(1)
    expect(await probe()).toEqual([{ prevented: true, qty: '5' }])
    await expect(submitsB).toHaveText('submits: 1')
    await page.getByTestId('commit-lab-submit').click()
    await expect.poll(async () => (await probe()).length).toBe(2)
    await expect(submitsB).toHaveText('submits: 2')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 8,8')
    expect(await probe()).toEqual([
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
    ])
    await page.getByTestId('commit-lab-reset').click()
    await expect(inputB).toHaveValue('5')
    await page.getByTestId('commit-lab-echo-on').click()
    await inputB.click()
    await inputB.fill('8')
    await page.getByTestId('commit-lab-outside').click()
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 8')
    await page.getByTestId('commit-lab-submit').click()
    await expect(submitsB).toHaveText('submits: 3')
    await expect.poll(async () => (await probe()).length).toBe(3)
    const finalProbeB = await probe()
    expect(finalProbeB[finalProbeB.length - 1]).toEqual({ prevented: false, qty: '8' })
  })
});
