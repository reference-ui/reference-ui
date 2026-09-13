import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Button Component', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Button/Button/ButtonStatesFixture')
    await expect(page.getByTestId('button-fixture-root')).toBeVisible()
  })

  test('BT-REST-01: Renders all button variants, icon configurations, and disabled states in resting state', async ({
    page,
  }) => {
    const btnDefault = page.getByTestId('btn-default')
    const btnPrimary = page.getByTestId('btn-primary')
    const btnGhost = page.getByTestId('btn-ghost')

    await expect(btnDefault).toBeVisible()
    await expect(btnPrimary).toBeVisible()
    await expect(btnGhost).toBeVisible()

    await snap(page, 'button-all-variants-resting')
  })

  test('BT-STATE-01: Default variant hover, active, focus, and click states', async ({
    page,
  }) => {
    const btn = page.getByTestId('btn-default')
    const counter = page.getByTestId('click-counter')

    // 1. Hover state
    await btn.hover()
    await page.waitForTimeout(50)
    await snap(page, 'button-default-hover')

    // 2. Active (pressed) state
    const box = await btn.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(50)
      await snap(page, 'button-default-active')
      await page.mouse.up()
    }

    // Verify click registered
    await expect(counter).toHaveText('1')

    // 3. Focus state (focus-visible)
    await btn.focus()
    await page.waitForTimeout(50)
    await snap(page, 'button-default-focus')
  })

  test('BT-STATE-02: Primary variant hover, active, focus, and click states', async ({
    page,
  }) => {
    const btn = page.getByTestId('btn-primary')
    const counter = page.getByTestId('click-counter')

    // 1. Hover state
    await btn.hover()
    await page.waitForTimeout(50)
    await snap(page, 'button-primary-hover')

    // 2. Active (pressed) state
    const box = await btn.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(50)
      await snap(page, 'button-primary-active')
      await page.mouse.up()
    }

    // Verify click registered
    await expect(counter).toHaveText('1')

    // 3. Focus state
    await btn.focus()
    await page.waitForTimeout(50)
    await snap(page, 'button-primary-focus')
  })

  test('BT-STATE-03: Ghost variant hover, active, focus, and click states', async ({
    page,
  }) => {
    const btn = page.getByTestId('btn-ghost')
    const counter = page.getByTestId('click-counter')

    // 1. Hover state
    await btn.hover()
    await page.waitForTimeout(50)
    await snap(page, 'button-ghost-hover')

    // 2. Active (pressed) state
    const box = await btn.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(50)
      await snap(page, 'button-ghost-active')
      await page.mouse.up()
    }

    // Verify click registered
    await expect(counter).toHaveText('1')

    // 3. Focus state
    await btn.focus()
    await page.waitForTimeout(50)
    await snap(page, 'button-ghost-focus')
  })

  test('BT-STATE-04: Icon button variants hover and focus states', async ({
    page,
  }) => {
    const btnLeading = page.getByTestId('btn-default-icon-leading')
    const btnTrailing = page.getByTestId('btn-default-icon-trailing')
    const btnIconOnly = page.getByTestId('btn-default-icon-only')

    // Leading icon hover
    await btnLeading.hover()
    await page.waitForTimeout(50)
    await snap(page, 'button-icon-leading-hover')

    // Trailing icon focus
    await btnTrailing.focus()
    await page.waitForTimeout(50)
    await snap(page, 'button-icon-trailing-focus')

    // Icon only hover
    await btnIconOnly.hover()
    await page.waitForTimeout(50)
    await snap(page, 'button-icon-only-hover')
  })

  test('BT-DIS-01: Disabled buttons do not fire clicks and show disabled styles', async ({
    page,
  }) => {
    const btnDisabledDefault = page.getByTestId('btn-default-disabled')
    const btnDisabledPrimary = page.getByTestId('btn-primary-disabled')
    const btnDisabledGhost = page.getByTestId('btn-ghost-disabled')
    const counter = page.getByTestId('click-counter')

    await expect(btnDisabledDefault).toBeDisabled()
    await expect(btnDisabledPrimary).toBeDisabled()
    await expect(btnDisabledGhost).toBeDisabled()

    // Attempt to click disabled button (force click)
    await btnDisabledDefault.click({ force: true })
    await expect(counter).toHaveText('0')

    await snap(page, 'button-disabled-states')
  })
})
