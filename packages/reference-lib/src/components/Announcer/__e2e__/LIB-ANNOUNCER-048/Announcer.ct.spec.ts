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

test('ANN-ENV-03: per-document stores recycle independently', async ({ mount, page }) => {
  await mount(MULTIDOC)
  await expect(page.getByTestId('md-ready')).toHaveText('ready')
  const frame = page.frameLocator('[data-testid="md-frame"]')

  await page.getByTestId('btn-md-top').click()
  await expect(page.locator('#root [data-reference-announcer="polite"]')).toHaveText('Top')
  await page.waitForTimeout(3500)
  await page.getByTestId('btn-md-frame').click()
  await expect(frame.locator('[data-reference-announcer="polite"]')).toHaveText('Frame')

  await page.waitForFunction(
    () =>
      document.querySelector('#root [data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 10000 }
  )
  await expect(frame.locator('[data-reference-announcer="polite"]')).toHaveText('Frame')
  await page.waitForFunction(
    () =>
      (
        document.querySelector('[data-testid="md-frame"]') as HTMLIFrameElement | null
      )?.contentDocument?.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 10000 }
  )
})
