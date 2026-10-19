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

test('ANN-LIFE-03: StrictMode mount replay speaks pending work once', async ({ mount, page }) => {
  await mount(STRICT)
  await expect(page.getByTestId('announcer-strict-root')).toBeVisible()

  await page.getByTestId('btn-strict-queue').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)
  await page.getByTestId('btn-strict-mount').click()

  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Ready')
  expect((await annLog(page)).filter(e => e === 'polite:Ready')).toHaveLength(1)
})
