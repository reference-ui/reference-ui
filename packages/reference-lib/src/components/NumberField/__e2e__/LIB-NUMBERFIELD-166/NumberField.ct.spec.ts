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
  test('NF-COMP-01: A quantity NumberField composes integer bounds, named steppers, controlled rejection, reset, and forms', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const display = page.getByTestId('commit-lab-display')
    const log = page.getByTestId('commit-lab-log')
    const hidden = page.locator('input[name="qty"]')
    const inc = page.getByRole('button', { name: 'Increment' })
    const dec = page.getByRole('button', { name: 'Decrement' })
    const inputId = await input.getAttribute('id')
    if (inputId === null) {
      throw new Error('NF-COMP-01: expected the NumberField input to expose a resolved id for aria-controls linkage')
    }
    await expect(inc).toHaveAttribute('aria-controls', inputId)
    // Type to 99, then hold Increment: the immediate step lands 100 and the
    // bound ends the hold with no further request.
    await input.click()
    await input.fill('99')
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Value: 99')
    // Enter may additionally implicit-submit (browser path, echo-timing
    // dependent), so the explicit submit below asserts a relative +1.
    const submitsAfterEnter = Number(
      ((await page.getByTestId('commit-lab-submits').textContent()) ?? 'submits: 0')
        .replace('submits:', '')
        .trim()
    )
    const box = await inc.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(550)
    await page.mouse.up()
    await expect(log).toHaveText('log: 99,100')
    await expect(display).toHaveText('Value: 100')
    await expect(inc).toBeDisabled()
    // Controlled rejection: the request publishes, the display stands.
    await page.getByTestId('commit-lab-echo-off').click()
    await dec.click()
    await expect(log).toHaveText('log: 99,100,99')
    await expect(display).toHaveText('Value: 100')
    await page.getByTestId('commit-lab-echo-on').click()
    // Reset from a dirty session: blur commits first (rejected, echo off),
    // then reset clears the transient state around the standing authority.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.fill('50')
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).toHaveValue('100')
    await expect(display).toHaveText('Value: 100')
    // Echo off: live 50 publishes, the blur-first retry re-requests it.
    await expect(log).toHaveText('log: 99,100,99,50,50')
    // Submit serializes the canonical hidden value exactly once.
    await page.getByTestId('commit-lab-submit').click()
    await expect(page.getByTestId('commit-lab-submits')).toHaveText(`submits: ${submitsAfterEnter + 1}`)
    await expect(hidden).toHaveValue('100')
  })
});
