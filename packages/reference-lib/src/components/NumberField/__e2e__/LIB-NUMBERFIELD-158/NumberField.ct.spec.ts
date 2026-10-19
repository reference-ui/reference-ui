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
  test('NF-EDIT-06: Horizontal navigation and selection remain native around localized tokens', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/NumberField/NumberField/UnboundedFixture')
    const input = page.getByTestId('unbounded-number-field-input')
    await input.click()
    const sel = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // Platform: bare Home/End are caret no-ops in Firefox/WebKit macOS
    // builds — Playwright delivers identical key events on all engines and
    // the product correctly leaves the keys unhandled on unbounded fields,
    // but only Chromium binds the native caret move. Assert the
    // native outcome per engine: Chromium moves, FF/WebKit hold position.
    const homeEndMove = browserName === 'chromium'
    const afterClick = await sel()
    await page.keyboard.press('End')
    expect(await sel()).toEqual(homeEndMove ? [1, 1] : afterClick)
    await page.keyboard.press('Home')
    expect(await sel()).toEqual(homeEndMove ? [0, 0] : afterClick)
    await page.keyboard.press('ArrowRight')
    expect(await sel()).toEqual([1, 1])
    await page.keyboard.press('Shift+ArrowLeft')
    expect(await sel()).toEqual([0, 1])
    await page.keyboard.press('ArrowRight')
    expect(await sel()).toEqual([1, 1])
    // Same platform class, split outcome: Control+ArrowLeft word-jumps on
    // Chromium and WebKit, but is a caret no-op on Firefox macOS (where
    // word-jump is Option+Arrow). Product leaves it unhandled everywhere.
    await page.keyboard.press('Control+ArrowLeft')
    expect(await sel()).toEqual(browserName === 'firefox' ? [1, 1] : [0, 0])
    await expect(input).toHaveValue('5')
    // Ranged dirty buffer incl. RTL text: navigation alone never commits.
    // Staged programmatically (letters are untypeable since NF-EDIT-02,
    // so the RTL buffer arrives the way autofill/composition would).
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '12א')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.setSelectionRange(3, 3)
    })
    await page.keyboard.press('Home')
    expect(await sel()).toEqual(homeEndMove ? [0, 0] : [3, 3])
    await page.keyboard.press('End')
    expect(await sel()).toEqual([3, 3])
    await expect(input).toHaveValue('12א')

    // No-request half on the echoing fixture: horizontal arrows never
    // publish (Home/End omitted here — that fixture has bounds, so they are
    // handled endpoint keys, proved natively above on the unbounded field).
    await mount('components/NumberField/NumberField/StepperFixture')
    const echoing = page.getByTestId('number-field-input')
    await echoing.click()
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(echoing).toHaveValue('42')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
  })
});
