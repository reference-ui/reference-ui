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

test('ANN-LIFE-07: fifty queued messages replay ordered and settle on the last', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-queue50').click()
  await page.getByTestId('btn-life-mount').click()
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === 'msg-49',
    { timeout: 30000 }
  )

  const expected = Array.from(
    { length: 50 },
    (_, i) => `polite:msg-${String(i).padStart(2, '0')}`
  )
  expect((await annLog(page)).filter(e => e.startsWith('polite:msg-'))).toEqual(expected)
})
