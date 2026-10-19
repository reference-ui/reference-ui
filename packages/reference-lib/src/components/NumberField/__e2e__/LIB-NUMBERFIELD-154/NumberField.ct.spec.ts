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
  test('NF-FORMAT-03: Referentially new but effectively equal format options preserve a dirty session', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/FormatSwapFixture')

    const input = page.getByTestId('format-swap-input')
    const log = page.getByTestId('format-swap-log')
    await input.click()
    await input.fill('1234.5')
    await input.evaluate(el => (el as HTMLInputElement).setSelectionRange(2, 5))
    const before = await input.evaluate(el => ({
      value: (el as HTMLInputElement).value,
      start: (el as HTMLInputElement).selectionStart,
      end: (el as HTMLInputElement).selectionEnd,
      editing: el.getAttribute('data-editing'),
    }))
    await input.evaluate(el => {
      ;(window as unknown as { __nfNode: unknown }).__nfNode = el
    })
    // Mousedown-prevented swap: rerender without blur, so only option
    // equality is under test.
    await page.getByTestId('format-swap-same').click()
    const after = await input.evaluate(el => ({
      value: (el as HTMLInputElement).value,
      start: (el as HTMLInputElement).selectionStart,
      end: (el as HTMLInputElement).selectionEnd,
      editing: el.getAttribute('data-editing'),
      sameNode: el === (window as unknown as { __nfNode: unknown }).__nfNode,
    }))
    expect(after).toEqual({ ...before, sameNode: true })
    await expect(input).toBeFocused()
    await expect(log).toHaveText('log: none')
  })
});
