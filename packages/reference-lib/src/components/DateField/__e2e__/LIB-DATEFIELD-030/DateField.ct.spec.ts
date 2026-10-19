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
  test('DF-CMT-07: composition suspends parsing and a stale end after value replace is ignored', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    const input = page.locator('#bday-childless')
    const changes = page.getByTestId('childless-changelog-count')
    await expect(input).toHaveValue('8/15/2026')

    await input.focus()
    await input.dispatchEvent('compositionstart')
    // Typing during composition joins the buffer but publishes nothing.
    // fill() on Firefox synthesizes a complete
    // native composition session (start/update/insertCompositionText/end) that
    // the product correctly commits — no real IME flow mirrors that inside an
    // open session (other DF composition tests are green on FF). Keystrokes
    // model the stated "typing" intent, so Firefox types instead of filling.
    if (engineOf() === 'firefox') {
      await input.press('Meta+a')
      await input.pressSequentially('9/1/2026')
    } else {
      await input.fill('9/1/2026')
    }
    await expect(input).toHaveValue('9/1/2026')
    await expect(changes).toHaveText('Changes: 0')

    // Programmatic replace during composition invalidates the session
    // (blur-commit is suspended too, so the click-through blur is silent).
    await page.getByTestId('btn-set-childless-val-1').click()
    await expect(input).toHaveValue('4/1/2024')
    await expect(changes).toHaveText('Changes: 0')

    // Stale compositionend fallout is ignored: no bogus request.
    await input.dispatchEvent('compositionend')
    await expect(page.getByTestId('childless-value-display')).toHaveText(
      'Childless Value: 2024-04-01'
    )
    await expect(changes).toHaveText('Changes: 0')
  })
});
