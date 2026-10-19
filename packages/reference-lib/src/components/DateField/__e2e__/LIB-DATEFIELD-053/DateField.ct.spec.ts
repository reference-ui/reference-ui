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

test.describe('DateField stepping', () => {
  test('DF-KEY-01: ArrowUp/Down step the caret day/month/year segment and commit one ISO', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const display = page.getByTestId('engine-value-display')
    const changes = page.getByTestId('engine-changes')
    const last = page.getByTestId('engine-last')

    await expect(input).toHaveValue('01/02/2024')
    await input.focus()

    await installControlledFrames(page)
    try {
      // Caret in the day segment steps the day and commits.
      await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(1, 1))
      await page.keyboard.press('ArrowUp')
      await expect(last).toHaveText('Last: "2024-02-02"')
      await expect(display).toHaveText('Engine Value: 2024-02-02')
      await expect(input).toHaveValue('02/02/2024')
      await expect(changes).toHaveText('Changes: 1')
      await expect(input).not.toHaveAttribute('data-editing', 'true')

      // Caret in the month segment steps the month. A newer manually authored
      // month selection must survive releasing work queued by the previous step.
      await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(4, 4))
      const caretBefore = await input.evaluate((el) => (el as HTMLInputElement).selectionStart)
      await releaseControlledFrames(page)
      const caretAfter = await input.evaluate((el) => (el as HTMLInputElement).selectionStart)
      console.info(
        `DF-KEY-01 controlled frame seam { before:${caretBefore}, after:${caretAfter} }`
      )
      await page.keyboard.press('ArrowDown')
      await expect(last).toHaveText('Last: "2024-01-02"')
      await expect(input).toHaveValue('02/01/2024')
      await expect(changes).toHaveText('Changes: 2')

      // Caret in the year segment steps the year.
      await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(8, 8))
      await page.keyboard.press('ArrowUp')
      await expect(last).toHaveText('Last: "2025-01-02"')
      await expect(input).toHaveValue('02/01/2025')
      await expect(changes).toHaveText('Changes: 3')

      // Repeated day stepping: the committed step must restore the day caret,
      // so a second step without re-seating the caret stays on the day segment.
      await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(1, 1))
      await page.keyboard.press('ArrowUp')
      await expect(last).toHaveText('Last: "2025-01-03"')
      await expect(input).toHaveValue('03/01/2025')
      await expect(changes).toHaveText('Changes: 4')

      await page.keyboard.press('ArrowUp')
      await expect(last).toHaveText('Last: "2025-01-04"')
      await expect(input).toHaveValue('04/01/2025')
      await expect(changes).toHaveText('Changes: 5')
    } finally {
      await cleanupControlledFrames(page)
    }
  })
});
