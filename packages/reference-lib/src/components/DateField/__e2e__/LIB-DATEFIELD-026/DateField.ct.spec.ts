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

test.describe('DateField re-targets', () => {
  test('constrained picker selection outside bounds or unavailable is rejected without commit (FEATURES #3)', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ConstrainedFixture')

    const input = page.getByTestId('constrained-input')
    const trigger = page.getByTestId('constrained-trigger')
    const picker = page.getByTestId('constrained-picker')
    const display = page.getByTestId('constrained-value-display')
    const changes = page.getByTestId('constrained-changes')

    await trigger.click()
    await expect(picker).toBeVisible()

    // Below min: disabled-unclickable (Calendar #6) — no commit, no dismiss.
    await expect(page.locator('button[data-date="2026-08-05"]')).toBeDisabled()
    await page.locator('button[data-date="2026-08-05"]').click({ force: true })
    await expect(display).toHaveText('Value: 2026-08-15')
    await expect(changes).toHaveText('Changes: 0')
    await expect(input).toHaveValue('8/15/2026')
    await expect(picker).toBeVisible()

    // Above max: disabled-unclickable the same way.
    await expect(page.locator('button[data-date="2026-08-25"]')).toBeDisabled()
    await page.locator('button[data-date="2026-08-25"]').click({ force: true })
    await expect(display).toHaveText('Value: 2026-08-15')
    await expect(changes).toHaveText('Changes: 0')
    await expect(picker).toBeVisible()

    // Marked unavailable: day stays enabled (context isDateUnavailable reaches
    // Calendar only via a pending change, still blocked) — DateField-side rejection
    // refuses the commit without dismiss.
    await page.locator('button[data-date="2026-08-12"]').click()
    await expect(display).toHaveText('Value: 2026-08-15')
    await expect(changes).toHaveText('Changes: 0')
    await expect(picker).toBeVisible()

    // In-range available date commits and dismisses.
    await page.locator('button[data-date="2026-08-18"]').click()
    await expect(display).toHaveText('Value: 2026-08-18')
    await expect(changes).toHaveText('Changes: 1')
    await expect(input).toHaveValue('8/18/2026')
    await expect(picker).toHaveCount(0)
  })
});
