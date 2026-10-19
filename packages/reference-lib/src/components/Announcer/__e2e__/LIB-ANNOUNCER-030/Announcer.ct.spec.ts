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

test('ANN-LIVE-06: channels recycle on independent deadlines', async ({ mount, page }) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-stagger-a').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('A')
  await page.waitForTimeout(3500)
  await page.getByTestId('btn-ann-stagger-b').click()
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('B')

  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 10000 }
  )
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('B')
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="assertive"]')?.textContent === '',
    { timeout: 10000 }
  )
})
