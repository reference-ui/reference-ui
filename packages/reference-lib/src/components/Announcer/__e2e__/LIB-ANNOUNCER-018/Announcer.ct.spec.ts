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

test('ANN-API-04: untargeted announce with one host inserts under that host only', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  // announce('Saved') omits both politeness and document.
  await page.getByTestId('btn-ann-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)

  const placement = await page.evaluate(() => {
    const host = document.querySelector('[data-reference-announcer-host]')
    const root = document.getElementById('root')
    return {
      inRoot: Boolean(host && root && root.contains(host)),
      directBodyChild: Boolean(document.querySelector('body > [data-reference-announcer-host]')),
    }
  })
  expect(placement).toEqual({ inRoot: true, directBodyChild: false })
})
