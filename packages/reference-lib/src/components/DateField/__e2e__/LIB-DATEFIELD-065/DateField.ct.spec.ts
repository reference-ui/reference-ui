/**
 * DateField browser proofs: compound rendering and picker flows plus the
 * DF re-target rows across DOM, keys, calendar, form, and bounds areas.
 * Mounts the story fixtures and asserts canonical-ISO discipline with
 * deliberate picker activation in a real browser.
 */
import type { Page } from '@playwright/test'
import { test, expect, snap } from '../../../../../playwright/ct'

// Landing-sequence engine scope: `engineOf` sniffs the Playwright project
// (`react19` on agentct Chromium, `react19-firefox`/`react19-webkit` on the
// sweep vehicle) for per-engine delivery/expectations.
function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

// DF-KEY-01 controlled-frame seam: deterministically parks queued
// requestAnimationFrame callbacks until an explicit release, so a
// first-step caret-restore frame cannot race a later manual caret move.
const STEP_RELEASE_FRAMES = 'reference-datefield-step-release-frames'
const STEP_CLEANUP_FRAMES = 'reference-datefield-step-cleanup-frames'

async function installControlledFrames(page: Page): Promise<void> {
  await page.evaluate(
    ({ releaseEvent, cleanupEvent }) => {
      const originalRequestAnimationFrame = window.requestAnimationFrame
      const originalCancelAnimationFrame = window.cancelAnimationFrame

      let nextHandle = -1
      const queued = new Map<number, FrameRequestCallback>()
      let installed = true

      const restoreNative = () => {
        if (!installed) return
        installed = false
        window.requestAnimationFrame = originalRequestAnimationFrame
        window.cancelAnimationFrame = originalCancelAnimationFrame
        queued.clear()
      }

      window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
        const handle = nextHandle
        nextHandle -= 1
        queued.set(handle, callback)
        return handle
      }

      window.cancelAnimationFrame = (handle: number): void => {
        if (queued.delete(handle)) return
        originalCancelAnimationFrame.call(window, handle)
      }

      const release = () => {
        const pending = Array.from(queued.values())
        restoreNative()
        for (const callback of pending) callback(performance.now())
      }

      const cleanup = () => {
        restoreNative()
        window.removeEventListener(releaseEvent, release)
        window.removeEventListener(cleanupEvent, cleanup)
      }

      window.addEventListener(releaseEvent, release)
      window.addEventListener(cleanupEvent, cleanup)
    },
    { releaseEvent: STEP_RELEASE_FRAMES, cleanupEvent: STEP_CLEANUP_FRAMES }
  )
}

async function releaseControlledFrames(page: Page): Promise<void> {
  await page.evaluate((releaseEvent) => {
    window.dispatchEvent(new Event(releaseEvent))
  }, STEP_RELEASE_FRAMES)
}

async function cleanupControlledFrames(page: Page): Promise<void> {
  await page.evaluate((cleanupEvent) => {
    window.dispatchEvent(new Event(cleanupEvent))
  }, STEP_CLEANUP_FRAMES)
}

test.describe('DateField.Range (FEATURES #2)', () => {
  test('DF-COMP-06: unfolding every part preserves managed invariants', async ({
    mount,
    page,
  }) => {
    // Single field: forged value/role lose to managed state, the Calendar
    // alias stays day-bound, selection publishes and dismisses.
    await mount('components/DateField/DateField/SingleUnfoldedFixture')

    const input = page.getByTestId('su-input')
    await expect(input).toHaveValue('10/04/2024')
    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('placeholder', 'Explicit')

    await input.click()
    await expect(page.getByTestId('su-picker')).toBeVisible()
    await page.locator('button[data-date="2024-04-15"]').click()
    await expect(page.getByTestId('su-value-display')).toHaveText('Value: 2024-04-15')
    await expect(page.getByTestId('su-changes')).toHaveText('Changes: 1')
    await expect(page.getByTestId('su-picker')).toHaveCount(0)

    // Range: forged Start value/role lose, placeholders land, the alias
    // stays range-bound, completion publishes and dismisses.
    await mount('components/DateField/DateField/UnfoldedRangeFixture')

    const start = page.getByTestId('ur-start')
    await expect(start).toHaveValue('10/04/2024')
    await expect(start).toHaveAttribute('role', 'combobox')
    await expect(start).toHaveAttribute('placeholder', 'From')
    await expect(page.getByTestId('ur-end')).toHaveAttribute('placeholder', 'To')

    await start.click()
    await expect(page.getByTestId('ur-picker')).toBeVisible()
    await page.locator('button[data-date="2024-04-12"]').click()
    await page.locator('button[data-date="2024-04-20"]').click()
    await expect(page.getByTestId('ur-last')).toHaveText(
      'Last: {"start":"2024-04-12","end":"2024-04-20"}'
    )
    await expect(page.getByTestId('ur-picker')).toHaveCount(0)
  })
});
