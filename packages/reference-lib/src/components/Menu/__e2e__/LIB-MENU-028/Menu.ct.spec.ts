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

test.describe('Menu parity (root-level re-targets)', () => {

  test('MN-DOM-04: Menu parts preserve native attributes and refs through interaction', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await trigger.click()
    const content = page.getByTestId('menu-content')
    await expect(content).toBeVisible()

    const itemEdit = page.getByTestId('menu-item-edit')
    await expect(itemEdit).toHaveAttribute('data-probe', 'item')
    expect(await itemEdit.evaluate(el => el.className)).toContain('menu-probe-class')
    await expect(content).toHaveAttribute('data-probe', 'content')

    const refs = page.getByTestId('menu-ref-display')
    // Separator renders a host element directly, so its ref resolves on every
    // runtime. Item/trigger/content refs cross RovingFocus.Item cloneElement or
    // Overlay ref-as-prop plumbing that only preserves props.ref on React 19.
    await expect(refs).toContainText('separator:DIV')

    const reactVersion = await page.locator('html').getAttribute('data-react-version')
    if (reactVersion?.startsWith('19')) {
      await expect(refs).toContainText('item:DIV')
      await expect(refs).toContainText('trigger:BUTTON')
      await expect(refs).toContainText('content:DIV')
      await expect(page.getByTestId('menu-trigger-probe-display')).toContainText('BUTTON')
    }
  })
})
