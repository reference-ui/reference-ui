import { expect, test } from '@playwright/test'

test.describe('Portal Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal')
    await expect(page.getByTestId('portal-fixture-root')).toBeVisible()
  })

  test('PT-DOM-01 & PT-CONTAINER-04: Places children directly in document.body when container is omitted or null', async ({
    page,
  }) => {
    const bodyNode = page.getByTestId('body-portalled-node')
    const nullNode = page.getByTestId('explicit-null-portalled-node')

    await expect(bodyNode).toBeVisible()
    await expect(nullNode).toBeVisible()

    // Assert they are children of body and not inside logical-parent
    const isInLogicalParent = await page
      .getByTestId('logical-parent')
      .locator('[data-testid="body-portalled-node"]')
      .count()
    expect(isInLogicalParent).toBe(0)
  })

  test('PT-DOM-03 & PT-CONTAINER-01: Relocates children into the resolved custom destination ref', async ({
    page,
  }) => {
    const container = page.getByTestId('custom-destination-container')
    const btn = container.getByTestId('context-and-event-btn')

    await expect(btn).toBeVisible()
  })

  test('PT-CONTAINER-02: Waits for late-resolved object ref without transient default body copy', async ({
    page,
  }) => {
    // Before resolving target, node should not exist in DOM
    const refNode = page.getByTestId('ref-portalled-node')
    await expect(refNode).toHaveCount(0)

    // Resolve target
    await page.getByTestId('btn-resolve-target').click()

    // Target is now mounted, child should appear inside it
    const resolvedContainer = page.getByTestId('dynamic-resolved-container')
    await expect(resolvedContainer.getByTestId('ref-portalled-node')).toBeVisible()
  })

  test('PT-CONTAINER-05: Moves subtree when resolved destination changes', async ({
    page,
  }) => {
    const targetA = page.getByTestId('target-a')
    const targetB = page.getByTestId('target-b')

    await expect(targetA.getByTestId('switchable-portalled-node')).toBeVisible()
    await expect(targetB.getByTestId('switchable-portalled-node')).toHaveCount(0)

    // Switch to target B
    await page.getByTestId('btn-switch-destination').click()

    await expect(targetA.getByTestId('switchable-portalled-node')).toHaveCount(0)
    await expect(targetB.getByTestId('switchable-portalled-node')).toBeVisible()
  })

  test('PT-REACT-01 & PT-REACT-02: Preserves logical context and bubbles React events to logical parent', async ({
    page,
  }) => {
    const btn = page.getByTestId('context-and-event-btn')
    await expect(btn).toHaveAttribute('data-context-val', 'logical-provider-value')

    const parentClickCount = page.getByTestId('parent-click-count')
    await expect(parentClickCount).toHaveText('0')

    await btn.click()

    // Clicking the portalled button bubbles React event to logical parent
    await expect(parentClickCount).toHaveText('1')
  })
})
