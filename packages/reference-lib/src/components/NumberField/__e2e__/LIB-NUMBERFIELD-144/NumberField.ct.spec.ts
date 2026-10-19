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
  test('NF-EDIT-19: Focused Input leaves wheel behavior entirely native inside a scrollable ancestor', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    // Zero wheel code in the engine: this title only pins the pass-through
    // Synthetic wheels never scroll the page themselves, so
    // defaultPrevented false + consumer receipt is the native proxy.
    const result = await input.evaluate(node => {
      const el = node as HTMLInputElement
      const spacer = document.createElement('div')
      spacer.id = '__nf_wheel_spacer__'
      spacer.style.height = '300vh'
      document.body.appendChild(spacer)

      const seen: Array<{
        dy: number
        dx: number
        shift: boolean
        ctrl: boolean
        prevented: boolean
      }> = []
      const onWheel = (e: WheelEvent) => {
        seen.push({
          dy: e.deltaY,
          dx: e.deltaX,
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          prevented: e.defaultPrevented,
        })
      }
      el.addEventListener('wheel', onWheel)
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
      const selectionBefore = [el.selectionStart, el.selectionEnd]

      const cases: WheelEventInit[] = [
        { deltaY: 100 },
        { deltaX: 100 },
        { deltaY: 100, shiftKey: true },
        { deltaY: 100, ctrlKey: true },
      ]
      for (const init of cases) {
        el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }))
      }

      const outcome = {
        seen,
        text: el.value,
        selectionBefore,
        selectionAfter: [el.selectionStart, el.selectionEnd],
        now: el.getAttribute('aria-valuenow'),
        editing: el.getAttribute('data-editing'),
      }
      el.removeEventListener('wheel', onWheel)
      spacer.remove()
      return outcome
    })

    // Consumer receives every native event, none prevented.
    expect(result.seen).toHaveLength(4)
    expect(result.seen.map(s => [s.dy, s.dx, s.shift, s.ctrl])).toEqual([
      [100, 0, false, false],
      [0, 100, false, false],
      [100, 0, true, false],
      [100, 0, false, true],
    ])
    expect(result.seen.every(s => s.prevented === false)).toBe(true)
    // Value, callback echo, text, selection, managed data unchanged.
    expect(result.text).toBe('42')
    expect(result.selectionAfter).toEqual(result.selectionBefore)
    expect(result.now).toBeNull()
    expect(result.editing).toBeNull()
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
  })
});
