import { expect, test } from '@playwright/test'

const fixtureDemoBgRgb = 'rgb(15, 23, 42)'
const fixtureDemoTextRgb = 'rgb(248, 250, 252)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'
const fixtureDemoPrivateBrandRgb = 'rgb(255, 0, 255)'

test.describe('T1 — extend one library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t1 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t1-root')).toBeVisible()
  })

  test('upstream extend-library DemoComponent is visible', async ({ page }) => {
    await expect(page.getByTestId('fixture-demo')).toBeVisible()
  })

  test('DemoComponent background resolves from upstream fixtureDemoBg token', async ({ page }) => {
    const bg = await page.getByTestId('fixture-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(fixtureDemoBgRgb)
  })

  test('DemoComponent eyebrow resolves from upstream fixtureDemoAccent token', async ({ page }) => {
    const color = await page.getByTestId('fixture-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(color.trim()).toBe(fixtureDemoAccentRgb)
  })

  test('DemoComponent copy resolves from upstream fixtureDemoText token', async ({ page }) => {
    const color = await page.getByTestId('fixture-demo-copy').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(color.trim()).toBe(fixtureDemoTextRgb)
  })

  test('extend-library private token does not resolve when rendered outside its own data-layer scope', async ({ page }) => {
    // The DemoComponent uses `_private.brand` for its private swatch. The
    // upstream library's portable CSS ships:
    //   .c__private\.brand { color: var(--colors-_private-brand); }
    // inside `@layer extend-library`, with the variable defined under
    // `[data-layer="extend-library"]`. When the consumer renders the
    // component without an explicit library-boundary wrapper that sets
    // `data-layer="extend-library"` on its subtree, the variable does not
    // resolve and the swatch falls back to the inherited `fixtureDemoText`
    // color from its parent. This is the current expected behavior:
    // `_private.brand` is scoped, not globally hoisted, to preserve privacy
    // when downstream consumers author against the same content-hashed class
    // (see the next test).
    const private_ = page.getByTestId('fixture-demo-private')
    const color = await private_.evaluate(el => getComputedStyle(el).color)
    expect(color.trim()).not.toBe(fixtureDemoPrivateBrandRgb)
  })

  test('downstream consumer cannot author against upstream _private tokens', async ({ page }) => {
    // chain-t1's own source attempts `css({ color: '_private.brand' })`. The
    // upstream `_private` subtree is stripped before it reaches chain-t1's
    // Panda config, so no rule is generated for that hash and the element
    // falls back to its inherited / default colors.
    const attempt = page.getByTestId('chain-t1-private-attempt')
    const color = await attempt.evaluate(el => getComputedStyle(el).color)
    const borderColor = await attempt.evaluate(el => getComputedStyle(el).borderColor)
    expect(color.trim()).not.toBe(fixtureDemoPrivateBrandRgb)
    expect(borderColor.trim()).not.toBe(fixtureDemoPrivateBrandRgb)
  })
})
