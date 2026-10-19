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

test('ANN-API-03: explicit document writes only the targeted document', async ({
  mount,
  page,
}) => {
  await mount(MULTIDOC)
  await expect(page.getByTestId('md-ready')).toHaveText('ready')
  const frame = page.frameLocator('[data-testid="md-frame"]')
  const topPolite = page.locator('#root [data-reference-announcer="polite"]')
  const framePolite = frame.locator('[data-reference-announcer="polite"]')

  await page.getByTestId('btn-md-top').click()
  await expect(topPolite).toHaveText('Top')
  await expect(framePolite).toHaveText('')

  await page.getByTestId('btn-md-frame').click()
  await expect(framePolite).toHaveText('Frame')
  await expect(topPolite).toHaveText('Top')

  const docs = await page.evaluate(() => {
    const top = document.querySelector('#root [data-reference-announcer="polite"]')
    const frameEl = document.querySelector('[data-testid="md-frame"]') as HTMLIFrameElement | null
    const frameRegion = frameEl?.contentDocument?.querySelector(
      '[data-reference-announcer="polite"]'
    )
    return {
      topOwnerIsTop: top?.ownerDocument === document,
      frameOwnerIsFrame:
        Boolean(frameRegion) && frameRegion?.ownerDocument === frameEl?.contentDocument,
      adopted: Boolean(frameRegion) && frameRegion?.ownerDocument === document,
    }
  })
  expect(docs).toEqual({ topOwnerIsTop: true, frameOwnerIsFrame: true, adopted: false })
})
