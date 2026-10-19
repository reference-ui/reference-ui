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

test('ANN-API-05: ambiguous untargeted call no-ops with one dev diagnostic (RL-ROOT-08 freeze)', async ({
  mount,
  page,
}) => {
  const warnings: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'warning') warnings.push(msg.text())
  })

  await mount(MULTIDOC)
  await expect(page.getByTestId('md-ready')).toHaveText('ready')
  const frame = page.frameLocator('[data-testid="md-frame"]')
  const topPolite = page.locator('[data-reference-announcer="polite"]')
  const framePolite = frame.locator('[data-reference-announcer="polite"]')

  await page.getByTestId('btn-md-top').click()
  await expect(topPolite).toHaveText('Top')
  await page.getByTestId('btn-md-frame').click()
  await expect(framePolite).toHaveText('Frame')

  await page.getByTestId('btn-md-untargeted').click()
  await page.getByTestId('btn-md-untargeted').click()
  await page.waitForTimeout(300)
  await expect(topPolite).toHaveText('Top')
  await expect(framePolite).toHaveText('Frame')

  expect(warnings.filter(w => w.includes('ambiguous untargeted call'))).toHaveLength(1)
})
