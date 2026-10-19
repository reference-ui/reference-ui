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

test('ANN-LIVE-07: recycle clear is not a message; repeat after clear inserts fresh', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-complete').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 15000 }
  )

  await page.getByTestId('btn-ann-snapshot').click()
  const snap = await page.evaluate(
    () => (window as unknown as { __annSnap?: unknown }).__annSnap
  )
  expect(snap).toMatchObject({ polite: '', assertive: '', pending: [] })

  const mark = (await annLog(page)).length
  await page.getByTestId('btn-ann-complete').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.waitForFunction(
    markLength =>
      ((window as unknown as { __annLog?: string[] }).__annLog ?? []).length > (markLength ?? 0),
    mark,
    { timeout: 5000 }
  )
  expect((await annLog(page)).slice(mark)).toContain('polite:Complete')
})
