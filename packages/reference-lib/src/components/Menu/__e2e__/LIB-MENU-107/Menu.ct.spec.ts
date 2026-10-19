/**
 * Menu browser proofs: composition gates plus the root-level parity
 * re-targets across DOM, focus, typeahead, and action rows. Mounts the
 * story fixtures and asserts levels, roving, and one-selection
 * discipline in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

async function centerOf(locator: {
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>
}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('expected a bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('Menu dynamic choice and link parts', () => {

  test('MN-LINK-06: Nested download links dismiss the tree without navigating', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-nested-trigger').click()
    await expect(page.getByTestId('menu-link-nested-root')).toBeFocused()
    await page.getByTestId('menu-link-nested-trigger').focus()
    await page.keyboard.press('ArrowRight')
    const download = page.getByTestId('menu-link-nested-download')
    await expect(download).toBeVisible()
    await expect(download).toHaveAttribute('download', 'nested.csv')

    await download.click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: NestedDownload')
    await expect(page.getByTestId('menu-link-nested-logs')).toHaveText(
      'Nested Logs: nested:onOpen,nested:onDismiss'
    )
    await expect(page.getByTestId('menu-link-nested-root')).toHaveCount(0)
    // a download is not a navigation, but the download
    // + same-document-fragment interaction is engine-native — Chromium
    // suppresses the fragment nav, Firefox/WebKit perform it (harmless hash).
    expect(await page.evaluate(() => window.location.hash)).toBe(
      engineOf() === 'chromium' ? '' : '#nested-dl'
    )
  })
})
