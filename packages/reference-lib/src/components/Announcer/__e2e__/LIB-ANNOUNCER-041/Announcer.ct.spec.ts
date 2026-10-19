/**
 * Announcer browser proofs: API routing, live-region DOM, live speech,
 * lifecycle replay, and Overlay exemption rows. Mounts the story
 * fixtures and asserts AT-observable insertions, never toast visuals.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../../../../../playwright/ct'

const PROBE = 'components/Announcer/Announcer/AnnouncerProbe'
const LIFECYCLE = 'components/Announcer/Announcer/AnnouncerLifecycle'
const STRICT = 'components/Announcer/Announcer/AnnouncerStrictLifecycle'
const OVERLAY_FIXTURE = 'components/Announcer/Announcer/AnnouncerOverlayFixture'
const ELECTION = 'components/Announcer/Announcer/AnnouncerElection'
const MULTIDOC = 'components/Announcer/Announcer/AnnouncerMultiDoc'

/** AT-observable mutation log recorded by useAnnouncerLog in the story. */
async function annLog(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __annLog?: string[] }).__annLog ?? []
  )
}

test('ANN-OV-03: pointer sequence on the announcer host is not an outside press', async ({
  mount,
  page,
}) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-open').click()
  await expect(page.getByTestId('ov-modal')).toBeVisible()

  const dispatchSequence = (selector: string) =>
    page.evaluate(sel => {
      const target = document.querySelector(sel) as HTMLElement
      const pointer = {
        bubbles: true,
        cancelable: true,
        composed: true,
        isPrimary: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
      }
      const mouse = { bubbles: true, cancelable: true, composed: true, button: 0 }
      target.dispatchEvent(new PointerEvent('pointerdown', pointer))
      target.dispatchEvent(new MouseEvent('mousedown', mouse))
      target.dispatchEvent(new PointerEvent('pointerup', pointer))
      target.dispatchEvent(new MouseEvent('mouseup', mouse))
      target.dispatchEvent(new MouseEvent('click', mouse))
    }, selector)

  await dispatchSequence('[data-reference-announcer-host]')
  await page.waitForTimeout(300)
  expect(
    await page.evaluate(() => (window as unknown as { __ovLog?: string[] }).__ovLog ?? [])
  ).toEqual([])
  await expect(page.getByTestId('ov-modal')).toBeVisible()

  // Control: the same sequence on an ordinary sibling is an outside press.
  await dispatchSequence('[data-testid="ov-sibling"]')
  await expect
    .poll(
      async () =>
        page.evaluate(() => (window as unknown as { __ovLog?: string[] }).__ovLog ?? []),
      { timeout: 5000 }
    )
    .toContain('outside')
})
