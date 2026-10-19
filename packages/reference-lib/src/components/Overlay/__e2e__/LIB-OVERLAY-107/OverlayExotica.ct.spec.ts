/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-INERT-10: reparent into a hidden subtree stays unreachable and deduped', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-inert-10').click()
    await expect(page.getByTestId('inert-10-content')).toBeVisible()

    const result = await page.evaluate(async () => {
      const wait = () => new Promise(r => setTimeout(r, 30))
      const outside = document.querySelector('[data-testid="inert-10-outside-host"]') as HTMLElement
      const hidden = document.querySelector('[data-testid="inert-10-hidden"]') as HTMLElement
      const node = document.createElement('button')
      node.type = 'button'
      node.setAttribute('data-testid', 'btn-inert-10-dyn')
      node.textContent = 'dyn'
      outside.appendChild(node)
      await wait()

      const afterInsert = {
        inert: node.hasAttribute('inert'),
        managed: node.hasAttribute('data-overlay-managed-inert'),
      }

      hidden.appendChild(node)
      await wait()
      const afterHidden = {
        inert: node.hasAttribute('inert'),
        managed: node.hasAttribute('data-overlay-managed-inert'),
        ariaAncestor: node.closest('[aria-hidden="true"]') !== null,
      }

      outside.appendChild(node)
      await wait()
      const afterReturn = {
        inert: node.hasAttribute('inert'),
        managed: node.hasAttribute('data-overlay-managed-inert'),
      }

      return { afterInsert, afterHidden, afterReturn }
    })

    expect(result.afterInsert.inert).toBe(true)
    expect(result.afterInsert.managed).toBe(true)
    expect(result.afterHidden.ariaAncestor).toBe(true)
    expect(result.afterHidden.managed).toBe(false)
    expect(result.afterReturn.inert).toBe(true)
    expect(result.afterReturn.managed).toBe(true)

    await page.getByTestId('btn-close-inert-10').click()
    await expect(page.getByTestId('inert-10-content')).toHaveCount(0)
    await expect(page.getByTestId('btn-inert-10-dyn')).not.toHaveAttribute('inert', '')
  })
})
