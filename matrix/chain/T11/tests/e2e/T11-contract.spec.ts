import { expect, test } from '@playwright/test'

const fixtureDemoBgRgb = 'rgb(15, 23, 42)'
const secondaryDemoBgRgb = 'rgb(6, 78, 59)'
const layerPrivateAccentRgb = 'rgb(99, 102, 241)'
const layerPrivateAccent2Rgb = 'rgb(159, 18, 57)'

test.describe('T11 — full mix (2 extends + 2 layers)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t11 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t11-root')).toBeVisible()
  })

  test('first extend-library DemoComponent resolves its tokens', async ({ page }) => {
    const bg = await page.getByTestId('fixture-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(fixtureDemoBgRgb)
  })

  test('second extend-library-2 SecondaryDemoComponent resolves its tokens', async ({ page }) => {
    const bg = await page.getByTestId('secondary-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(secondaryDemoBgRgb)
  })

  test('first layer-library LayerPrivateDemo resolves from its layer scope', async ({ page }) => {
    const bg = await page.getByTestId('layer-private-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(layerPrivateAccentRgb)
  })

  test('second layer-library-2 LayerPrivate2Demo resolves from its layer scope', async ({ page }) => {
    const bg = await page.getByTestId('layer-private-2-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(layerPrivateAccent2Rgb)
  })

  test('assembled @layer prelude lists extends... before layers... before local', async ({ page }) => {
    const preludeText = await page.evaluate(() => {
      const cssTexts: string[] = []
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            // Type guard for CSSLayerStatementRule which has nameList
            const layerRule = rule as CSSRule & { nameList?: string[] }
            if (layerRule.nameList && Array.isArray(layerRule.nameList)) {
              cssTexts.push(layerRule.nameList.join(','))
            }
          }
        } catch {
          // cross-origin
        }
      }
      return cssTexts.join('|')
    })

    // Find any prelude that has all four upstream names plus chain-t11.
    expect(preludeText).toContain('extend-library')
    expect(preludeText).toContain('extend-library-2')
    expect(preludeText).toContain('layer-library')
    expect(preludeText).toContain('layer-library-2')
    expect(preludeText).toContain('chain-t11')

    // Verify ordering on a single prelude entry (the first that mentions chain-t11).
    const candidate = preludeText
      .split('|')
      .find(entry => entry.includes('chain-t11'))
    expect(candidate, 'expected a prelude entry containing chain-t11').toBeDefined()
    const order = candidate!.split(',').map(name => name.trim())
    const indexOf = (name: string) => order.indexOf(name)
    expect(indexOf('extend-library')).toBeLessThan(indexOf('layer-library'))
    expect(indexOf('extend-library-2')).toBeLessThan(indexOf('layer-library'))
    expect(indexOf('layer-library')).toBeLessThan(indexOf('chain-t11'))
    expect(indexOf('layer-library-2')).toBeLessThan(indexOf('chain-t11'))
  })
})
