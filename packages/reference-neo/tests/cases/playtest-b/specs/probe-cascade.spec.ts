// probe-cascade.spec.ts — computed-style pattern probes for NEO-PLAY-B-01.
// Takes { page } from the runner with the page already navigated to the
// served world. Emits nothing on success; throws naming the losing rule
// when specificity or the theme flip does not paint as expected.
import assert from 'node:assert/strict';
import type { SpecPage } from '../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
}

// Browser-serializable readers: evaluate ships the function source across,
// so readers close over nothing and name their property inline.
function readColor(el: HTMLElement): string {
  return getComputedStyle(el).color;
}

function readBackground(el: HTMLElement): string {
  return getComputedStyle(el).backgroundColor;
}

// Reads one computed style off the first node matching selector.
async function computed(page: SpecPage, selector: string, read: (el: HTMLElement) => string): Promise<string> {
  const node = page.locator(selector);
  await node.waitFor();
  return node.evaluate(read);
}

// Id selector beats class beats element: the target paints green.
export default async function run({ page }: SpecInput): Promise<void> {
  const color = await computed(page, '#target', readColor);
  assert.equal(color, 'rgb(0, 128, 0)', `id rule wins the cascade, got ${color}`);

  const swatch = page.locator('#swatch');
  await swatch.waitFor();
  const before = await computed(page, '#swatch', readBackground);
  assert.equal(before, 'rgb(128, 128, 128)', `plain theme paints grey, got ${before}`);

  const body = page.locator('body');
  await body.evaluate((el) => {
    el.classList.remove('plain');
    el.classList.add('fancy');
  });
  const after = await computed(page, '#swatch', readBackground);
  assert.equal(after, 'rgb(128, 0, 128)', `fancy theme repaints purple, got ${after}`);
}
