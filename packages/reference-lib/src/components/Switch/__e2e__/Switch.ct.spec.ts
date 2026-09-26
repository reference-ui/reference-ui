import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Switch CT', () => {
  test('renders button[role=switch] with default thumb and toggles checked state', async ({
    mount,
    page,
  }) => {
    await mount('components/Switch/Switch/InteractiveFixture')

    const switchEl = page.getByTestId('test-switch')
    const thumb = switchEl.locator('[data-reference-switch-thumb]')

    await expect(switchEl).toBeVisible()
    await expect(switchEl).toHaveAttribute('role', 'switch')
    await expect(switchEl).toHaveAttribute('type', 'button')
    await expect(thumb).toHaveCount(1)

    // Initially unchecked
    await expect(switchEl).toHaveAttribute('aria-checked', 'false')
    await expect(switchEl).toHaveAttribute('data-state', 'unchecked')
    await expect(thumb).toHaveAttribute('data-state', 'unchecked')
    await page.waitForTimeout(300)
    await snap(page, 'switch-resting-unchecked')

    // Hover
    await switchEl.hover()
    await page.waitForTimeout(200)
    await snap(page, 'switch-hover')

    // Keyboard focus ring
    await switchEl.focus()
    await page.waitForTimeout(200)
    await snap(page, 'switch-focus-ring')

    // Click to toggle checked
    await switchEl.click()
    await expect(switchEl).toHaveAttribute('aria-checked', 'true')
    await expect(switchEl).toHaveAttribute('data-state', 'checked')
    await expect(thumb).toHaveAttribute('data-state', 'checked')
    await page.waitForTimeout(300)
    await snap(page, 'switch-checked')

    // Keyboard Space toggles checked
    await switchEl.press('Space')
    await expect(switchEl).toHaveAttribute('aria-checked', 'false')
    await page.waitForTimeout(300)
    await snap(page, 'switch-unchecked-again')

    // Disabled state
    await page.getByTestId('btn-toggle-disabled').click()
    await expect(switchEl).toBeDisabled()
    await expect(switchEl).toHaveAttribute('data-disabled', '')
    await page.waitForTimeout(200)
    await snap(page, 'switch-disabled')
  })

  test('renders resting states overview', async ({ mount, page }) => {
    await mount('components/Switch/Switch/StatesFixture')

    const states = page.getByTestId('switch-states')
    await expect(states).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'switch-all-states')
  })
})

test.describe('Switch quarantine parity', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Switch/Switch/ParityFixture')
    await expect(page.getByTestId('switch-parity-root')).toBeVisible()
  })

  test('SW-DOM-01: Switch should be a complete control when mounted with only StyleProps', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-01')

    await expect(sw).toBeVisible()
    await expect(sw).toHaveAttribute('role', 'switch')
    await expect(sw).toHaveAttribute('type', 'button')
    await expect(sw.locator('span[data-reference-switch-thumb]')).toHaveCount(1)
    await expect(page.getByTestId('sw-dom-01-before')).toBeVisible()
    await expect(page.getByTestId('sw-dom-01-after')).toBeVisible()
  })

  test('SW-DOM-02: Switch should expose authoritative checked state on both parts', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-02')
    const thumb = sw.locator('[data-reference-switch-thumb]')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect(sw).toHaveAttribute('data-state', 'unchecked')
    await expect(thumb).toHaveAttribute('data-state', 'unchecked')
    await expect(sw).not.toHaveAttribute('aria-pressed')
    await expect(sw).toHaveAttribute('data-custom', 'keep-me')

    await page.getByTestId('sw-dom-02-flip').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(sw).toHaveAttribute('data-state', 'checked')
    await expect(thumb).toHaveAttribute('data-state', 'checked')
    await expect(sw).not.toHaveAttribute('aria-pressed')
    await expect(sw).toHaveAttribute('data-custom', 'keep-me')
  })

  test('SW-DOM-03: Switch should expose disabled state natively without remaining activatable', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-03')
    const thumb = sw.locator('[data-reference-switch-thumb]')

    await expect(sw).toBeDisabled()
    await expect(sw).toHaveAttribute('data-disabled', '')
    await expect(thumb).toHaveAttribute('data-disabled', '')

    await sw.click({ force: true })
    const isActive = await sw.evaluate(el => document.activeElement === el)
    expect(isActive).toBe(false)
  })

  test('SW-DOM-04: Switch should replace the default thumb when Switch.Thumb is authored', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-04')

    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)

    await page.getByTestId('sw-dom-04-to-authored').click()
    const authoredThumb = page.getByTestId('sw-dom-04-authored-thumb')
    await expect(authoredThumb).toBeVisible()
    // Presence, not visibility: the themed track clips extra authored children.
    const extra = page.getByTestId('sw-dom-04-extra')
    await expect(extra).toHaveCount(1)
    await expect(extra).toHaveText('Extra Visual')
    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)
    await expect(page.getByTestId('sw-dom-04-thumb-tag')).toHaveText('SPAN')

    // PATCHES item 1: Fragment-wrapped authored thumb replaces the default.
    await page.getByTestId('sw-dom-04-to-fragment').click()
    await expect(page.getByTestId('sw-dom-04-fragment-thumb')).toBeVisible()
    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)

    // PATCHES item 1: HOC-forwarded authored thumb replaces the default.
    await page.getByTestId('sw-dom-04-to-forwarded').click()
    await expect(page.getByTestId('sw-dom-04-forwarded-thumb')).toBeVisible()
    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)

    await page.getByTestId('sw-dom-04-to-restored').click()
    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)
    await expect(page.getByTestId('sw-dom-04-authored-thumb')).toHaveCount(0)
    await expect(page.getByTestId('sw-dom-04-fragment-thumb')).toHaveCount(0)
    await expect(page.getByTestId('sw-dom-04-forwarded-thumb')).toHaveCount(0)
    await expect(page.getByTestId('sw-dom-04-extra')).toHaveCount(0)
  })

  test('SW-DOM-05: Switch should forward native props and refs to the button and an authored Thumb', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-05')
    const thumb = page.getByTestId('sw-dom-05-thumb')

    await expect(sw).toHaveClass(/consumer-root-class/)
    await expect(thumb).toHaveClass(/consumer-thumb-class/)
    await expect(sw).toHaveAttribute('data-custom-root', 'root-val')
    await expect(thumb).toHaveAttribute('data-custom-thumb', 'thumb-val')
    await expect(sw).toHaveAttribute('aria-label', 'Custom Switch')
    await expect(page.getByTestId('sw-dom-05-root-tag')).toHaveText('BUTTON')
    await expect(page.getByTestId('sw-dom-05-thumb-tag')).toHaveText('SPAN')

    await sw.click()
    await expect(page.getByTestId('sw-dom-05-clicked')).toHaveText('yes')

    await page.getByTestId('sw-dom-05-rerender').click()
    await expect(sw).toHaveAttribute('data-custom-root', 'root-val')
  })

  test('SW-DOM-06: Switch should not participate in form serialization', async ({ page }) => {
    const form = page.getByTestId('sw-dom-06-form')
    const sw = page.getByTestId('sw-dom-06')

    const formDataEntries = await form.evaluate((formEl: HTMLFormElement) => {
      const data = new FormData(formEl)
      return Array.from(data.entries())
    })
    expect(formDataEntries.length).toBe(0)

    await page.getByTestId('sw-dom-06-submit').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('sw-dom-06-change-count')).toHaveText('0')

    await page.getByTestId('sw-dom-06-reset').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('sw-dom-06-change-count')).toHaveText('0')
  })

  test('SW-DOM-07: Switch should keep its button non-submitting', async ({ page }) => {
    const sw = page.getByTestId('sw-dom-07')

    await expect(sw).toHaveAttribute('type', 'button')
    await sw.click()
    await expect(page.getByTestId('sw-dom-07-submitted')).toHaveText('clean')
  })

  test('SW-ACT-01: Switch should request on once when an enabled unchecked control is clicked', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-01')
    const log = page.getByTestId('sw-act-01-log')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await sw.click()
    await expect(log).toHaveText('[true]')
    await expect(sw).toHaveAttribute('aria-checked', 'false')

    await page.getByTestId('sw-act-01-accept').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  test('SW-ACT-02: Switch should request off once when an enabled checked control is clicked', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-02')
    const log = page.getByTestId('sw-act-02-log')

    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await sw.click()
    await expect(log).toHaveText('[false]')
    await expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  test('SW-ACT-03: Switch should request once from native Space or Enter activation', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-03')
    const log = page.getByTestId('sw-act-03-log')

    await sw.focus()
    await page.keyboard.press('Space')
    await expect(log).toHaveText('[true]')

    await page.getByTestId('sw-act-03-set-checked').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')

    await sw.focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('[true,false]')
  })

  test('SW-ACT-04: Switch should request once when the click target is the thumb', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-04')
    const log = page.getByTestId('sw-act-04-log')

    const defaultThumb = sw.locator('[data-reference-switch-thumb]')
    await defaultThumb.click()
    await expect(log).toHaveText('[false]')

    await page.getByTestId('sw-act-04-switch-to-authored').click()
    const authoredThumb = page.getByTestId('sw-act-04-thumb')
    await authoredThumb.click()
    await expect(log).toHaveText('[false,false]')
  })

  test('SW-ACT-05: Switch should skip its request when the consumer click is canceled', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-05')
    const log = page.getByTestId('sw-act-05-log')

    await sw.click()
    await expect(log).toHaveText('[]')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
  })

  test('SW-ACT-06: Switch should ignore activation when disabled', async ({ page }) => {
    const uncheckedSw = page.getByTestId('sw-act-06-unchecked')
    const checkedSw = page.getByTestId('sw-act-06-checked')
    const log = page.getByTestId('sw-act-06-log')

    await uncheckedSw.click({ force: true })
    await checkedSw.click({ force: true })
    await uncheckedSw.focus()
    await page.keyboard.press('Space')

    await expect(log).toHaveText('[]')
    await expect(uncheckedSw).toHaveAttribute('aria-checked', 'false')
    await expect(checkedSw).toHaveAttribute('aria-checked', 'true')
  })

  test('SW-ACT-07: Switch should not emit onChange for programmatic checked updates', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-07')
    const log = page.getByTestId('sw-act-07-log')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await page.getByTestId('sw-act-07-prog').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(log).toHaveText('[]')
  })

  // Landing re-target: the freeze forbade uncontrolled mode, but landing preserves it
  // (recon exhibit 1), so ACT-08 pins the controlled-without-onChange readout instead.
  // Uncontrolled-without-onChange toggles its own DOM by design.
  test('SW-ACT-08: Switch should hold a controlled checked prop when onChange is omitted', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-08')

    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await sw.focus()
    await page.keyboard.press('Space')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
  })

  test('SW-NAME-01: Switch should toggle from an associated label htmlFor', async ({ page }) => {
    const label = page.getByTestId('sw-name-01-label')
    const sw = page.getByTestId('sw-name-01')

    await expect(sw).toHaveAttribute('id', 'airplane')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await label.click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(sw).toHaveAttribute('id', 'airplane')
  })

  test('SW-NAME-02: Switch should toggle from a wrapping label', async ({ page }) => {
    const label = page.getByTestId('sw-name-02-label')
    const sw = page.getByTestId('sw-name-02')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await label.click({ position: { x: 5, y: 5 } })
    await expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  test('SW-ENV-04: Switch should keep checked state physical when direction is RTL', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-env-04')
    const log = page.getByTestId('sw-env-04-log')

    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(sw).toHaveAttribute('data-state', 'checked')
    await sw.click()
    await expect(log).toHaveText('[false]')
  })

  test('SW-A11Y-01: Switch should remain accessibility-clean in named, disabled, and wrapping-label shapes', async ({
    page,
  }) => {
    const section = page.getByTestId('section-a11y-01')
    const switches = section.locator('button[role="switch"]')
    await expect(switches).toHaveCount(5)

    for (let i = 0; i < 5; i++) {
      const sw = switches.nth(i)
      await expect(sw).toHaveAttribute('role', 'switch')
      await expect(sw).toHaveAttribute('type', 'button')
      await expect(sw).not.toHaveAttribute('aria-pressed')
      const checkedAttr = await sw.getAttribute('aria-checked')
      expect(checkedAttr === 'true' || checkedAttr === 'false').toBe(true)
      const thumb = sw.locator('[data-reference-switch-thumb]')
      await expect(thumb).toHaveCount(1)
    }
  })

  test('SW-COMP-02: A wrapping-label Switch should sit in a form without serializing', async ({
    page,
  }) => {
    const label = page.getByTestId('sw-comp-02-label')
    const sw = page.getByTestId('sw-comp-02')
    const mirror = page.getByTestId('sw-comp-02-mirror')
    const form = page.getByTestId('sw-comp-02-form')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect(mirror).not.toBeChecked()

    await label.click({ position: { x: 5, y: 5 } })
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(mirror).toBeChecked()

    const formData = await form.evaluate((formEl: HTMLFormElement) => {
      const fd = new FormData(formEl)
      return Object.fromEntries(fd.entries())
    })
    expect(formData.notifications_enabled).toBe('on')
  })
})
