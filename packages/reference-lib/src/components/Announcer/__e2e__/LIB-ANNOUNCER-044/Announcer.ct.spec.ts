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

test('ANN-HOST-02 / RL-ROOT-03: announcer fails over with the standby root', async ({
  mount,
  page,
}) => {
  await mount(ELECTION)
  await expect(page.getByTestId('root-primary')).toBeVisible()

  await page.getByTestId('btn-el-announce').click()
  await expect(
    page.getByTestId('root-primary').locator('[data-reference-announcer="polite"]')
  ).toHaveText('Once')

  await page.getByTestId('btn-el-unmount-primary').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)
  await expect(
    page.getByTestId('root-standby').locator('[data-reference-announcer-host]')
  ).toHaveCount(1)

  await page.getByTestId('btn-el-handoff').click()
  await expect(
    page.getByTestId('root-standby').locator('[data-reference-announcer="polite"]')
  ).toHaveText('Handoff')
  expect((await annLog(page)).filter(e => e === 'polite:Handoff')).toHaveLength(1)
})
