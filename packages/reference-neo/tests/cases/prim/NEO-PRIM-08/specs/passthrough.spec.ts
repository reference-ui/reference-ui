// passthrough.spec.ts — spec for NEO-PRIM-08, the DOM passthrough case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the DOM
// prop that never landed, the handler that never fired, the leaked style
// key, or the tag an as prop managed to change on failure.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner hands specs the real Playwright page, whose click member the
// narrow SpecPage shape omits; this interface names just that member.
interface ClickPage {
  click(selector: string): Promise<void>;
}

// Everything DOM lands, everything style resolves, nothing crosses. The
// click handler fires, the ref callback marks the host it receives, and the
// styles paint — while the as probe keeps rendering its own tag element.
export default async function run({ page, case: _c }: SpecInput): Promise<void> {
  void _c;
  const dom = page.locator('#dom');
  await dom.waitFor();

  assert.equal(await dom.evaluate((el) => el.getAttribute('aria-label')), 'prim target', 'aria lands');
  assert.equal(await dom.evaluate((el) => el.getAttribute('data-testid')), 'prim-dom', 'data lands');
  assert.equal(await dom.evaluate((el) => el.getAttribute('title')), 'hi', 'title lands');
  assert.equal(
    await dom.evaluate((el) => el.getAttribute('data-ref')),
    'seen',
    'ref callback receives the host element',
  );
  assert.equal(
    await dom.evaluate((el) => el.getAttribute('data-layer')),
    'neo-prim8',
    'probe stamps the system layer',
  );

  assert.equal(await dom.evaluate((el) => el.getAttribute('color')), null, 'color stays off');
  assert.equal(await dom.evaluate((el) => el.getAttribute('p')), null, 'p stays off');
  assert.equal(await dom.evaluate((el) => el.getAttribute('css')), null, 'css stays off');
  assert.equal(await dom.evaluate((el) => el.getAttribute('variant')), null, 'variant stays off');
  assert.equal(
    await dom.evaluate((el) => el.getAttribute('colorMode')),
    null,
    'colorMode stays off',
  );

  const color = await dom.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(124, 58, 237)', `sibling color paints, got ${color}`);
  const padding = await dom.evaluate((el) => getComputedStyle(el).paddingTop);
  assert.equal(padding, '8px', `css spacing paints, got ${padding}`);

  const clicks = page.locator('#clicks');
  await clicks.waitFor();
  const clickPage = page as unknown as ClickPage;
  await clickPage.click('#dom');
  const after = await clicks.evaluate((el) => el.textContent);
  assert.equal(after, 'clicked', 'click handler fires through the primitive');

  const noPoly = page.locator('#no-poly');
  await noPoly.waitFor();
  assert.equal(
    await noPoly.evaluate((el) => el.tagName),
    'DIV',
    'as never polymorphs: the tag renders its own element',
  );
}
