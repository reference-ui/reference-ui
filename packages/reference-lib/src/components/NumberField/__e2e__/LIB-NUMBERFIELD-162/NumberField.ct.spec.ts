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
  test('NF-COMMIT-01: Blur commits after the consumer handler and retries a candidate that differs from controlled value', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const order = page.getByTestId('commit-lab-order')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const hidden = page.locator('input[name="qty"]')
    await input.click()
    // Live 7 lands immediately (echo on); blur then only veto-checks —
    // consumer blur runs with no commit request after it.
    await input.fill('7')
    await expect(log).toHaveText('log: 7')
    await page.getByTestId('commit-lab-outside').click()
    await expect(order).toHaveText('order: request,blur')
    await expect(log).toHaveText('log: 7')
    await expect(display).toHaveText('Value: 7')
    await expect(hidden).toHaveValue('7')
    // Platform: Safari never moves focus on click — buttons/links are not
    // click-focusable (only text controls take click focus; mousedown still
    // blurs, so the commit above fires identically). The landing differs,
    // not the publish.
    if (browserName === 'webkit') {
      await expect(page.getByTestId('commit-lab-outside')).not.toBeFocused()
    } else {
      await expect(page.getByTestId('commit-lab-outside')).toBeFocused()
    }
    // Delayed echo: the live request publishes (hidden stays controlled),
    // blur retries it, and the echo-on retype lands the value live.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.fill('8')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 7,8,8')
    await expect(display).toHaveText('Value: 7')
    await expect(hidden).toHaveValue('7')
    await page.getByTestId('commit-lab-echo-on').click()
    await input.click()
    await input.fill('8')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 7,8,8,8')
    await expect(display).toHaveText('Value: 8')
  })
});
