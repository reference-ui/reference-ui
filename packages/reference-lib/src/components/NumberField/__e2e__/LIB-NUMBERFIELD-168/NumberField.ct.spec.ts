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
  test('NF-FORM-12: Implicit Enter submit after an unaccepted key commit stays blocked without a second submit', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="commit-lab-form"]') as HTMLFormElement
      ;(window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> }).__nfSubmits =
        []
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
    const input = page.getByTestId('commit-lab-input')
    const submits = page.getByTestId('commit-lab-submits')
    await input.click()
    await input.fill('-')
    await page.keyboard.press('Enter')
    // Key commit precedes the native implicit submit: exactly one submit
    // event (never a NumberField-synthesized second), prevented, carrying
    // the controlled hidden value — never the partial.
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: key')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toBeFocused()
    await expect.poll(async () => (await probe()).length).toBe(1)
    expect(await probe()).toEqual([{ prevented: true, qty: '5' }])
    await expect(submits).toHaveText('submits: 1')
    // Repeated Enter and click attempts remain blocked without consumption.
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await probe()).length).toBe(2)
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
    // Resolution: a valid accepted edit clears the boundary/invalid state,
    // then submit succeeds (relative count — Enter may additionally
    // implicit-submit depending on echo timing, COMP-01 pattern).
    await input.click()
    await input.fill('9')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 9')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 9')
    const submitsAfterEnter = Number(
      ((await submits.textContent()) ?? 'submits: 0').replace('submits:', '').trim()
    )
    await page.getByTestId('commit-lab-submit').click()
    await expect(submits).toHaveText(`submits: ${submitsAfterEnter + 1}`)
    await expect.poll(async () => {
      const polled = await probe()
      return polled[polled.length - 1]?.prevented
    }).toBe(false)
    const finalProbeB = await probe()
    expect(finalProbeB[finalProbeB.length - 1]).toEqual({ prevented: false, qty: '9' })
  })
});
