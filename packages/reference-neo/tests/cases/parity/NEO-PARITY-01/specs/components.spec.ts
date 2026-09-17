// components.spec.ts — spec for NEO-PARITY-01, the six mini-lib components.
// Takes { page } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the first
// component, recipe, or flip repaint that fails to paint on failure.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const LIGHT = {
  brand: 'rgb(124, 58, 237)',
  ink: 'rgb(17, 17, 17)',
  paper: 'rgb(255, 255, 255)',
  accent: 'rgb(22, 163, 74)',
  panel: 'rgb(243, 244, 246)',
  fieldBorder: 'rgb(209, 213, 219)',
  tableBorder: 'rgb(229, 231, 235)',
  placeholder: 'rgb(156, 163, 175)',
  clear: 'rgba(0, 0, 0, 0)',
};

const DARK = {
  brand: 'rgb(167, 139, 250)',
  ink: 'rgb(245, 245, 245)',
  accent: 'rgb(74, 222, 128)',
  buttonInk: 'rgb(17, 17, 17)',
  panel: 'rgb(17, 24, 39)',
};

async function checkButton(page: SpecPage): Promise<void> {
  // Button: variant stamps data-variant, the primitive stamps ref-button and
  // data-layer, the :where() tag recipe paints brand, the :has(icon) rule
  // indents. The unvarianted twin stays transparent with ink text.
  const button = page.locator('#comp-button');
  await button.waitFor();
  assert.equal(await button.evaluate((el) => el.getAttribute('data-variant')), 'primary');
  assert.equal(await button.evaluate((el) => el.getAttribute('data-layer')), 'neo-parity');
  assert.ok((await button.evaluate((el) => el.getAttribute('class')) ?? '').includes('ref-button'));
  assert.equal(await button.evaluate((el) => getComputedStyle(el).backgroundColor), LIGHT.brand);
  assert.equal(await button.evaluate((el) => getComputedStyle(el).color), LIGHT.paper);
  assert.equal(await button.evaluate((el) => getComputedStyle(el).paddingLeft), '8px');

  const base = page.locator('#comp-button-base');
  await base.waitFor();
  assert.equal(await base.evaluate((el) => getComputedStyle(el).backgroundColor), LIGHT.clear);
  assert.equal(await base.evaluate((el) => getComputedStyle(el).color), LIGHT.ink);

}

async function checkField(page: SpecPage): Promise<void> {
  // Field: bezel border paints, the slotted control inherits the field
  // surface, placeholder and aria passthrough land on the input.
  const field = page.locator('#comp-field');
  await field.waitFor();
  assert.equal(await field.evaluate((el) => getComputedStyle(el).borderTopColor), LIGHT.fieldBorder);
  const control = page.locator('#comp-field-input');
  await control.waitFor();
  assert.equal(await control.evaluate((el) => getComputedStyle(el).color), LIGHT.ink);
  assert.equal(await control.evaluate((el) => getComputedStyle(el, '::placeholder').color), LIGHT.placeholder);
  assert.equal(await control.evaluate((el) => el.getAttribute('data-slot')), 'control');
  assert.equal(await control.evaluate((el) => el.getAttribute('aria-label')), 'name');

}

async function checkRest(page: SpecPage): Promise<void> {
  // File, disclosure, table, link, quote, list: static plus semantic paint.
  const file = page.locator('#comp-file');
  await file.waitFor();
  assert.equal(await file.evaluate((el) => getComputedStyle(el).color), LIGHT.ink);
  const summary = page.locator('#comp-disc-summary');
  await summary.waitFor();
  assert.equal(await summary.evaluate((el) => getComputedStyle(el).color), LIGHT.ink);
  const table = page.locator('#comp-table');
  await table.waitFor();
  assert.equal(await table.evaluate((el) => getComputedStyle(el).borderTopColor), LIGHT.tableBorder);
  const cell = page.locator('#comp-table-cell');
  await cell.waitFor();
  assert.equal(await cell.evaluate((el) => getComputedStyle(el).color), LIGHT.ink);
  const link = page.locator('#comp-link');
  await link.waitFor();
  assert.equal(await link.evaluate((el) => getComputedStyle(el).color), LIGHT.accent);
  const quote = page.locator('#comp-quote');
  await quote.waitFor();
  assert.equal(await quote.evaluate((el) => getComputedStyle(el).fontStyle), 'italic');
  assert.ok(
    (await quote.evaluate((el) => getComputedStyle(el, '::before').content)).includes('“'),
    'quote opens with the before mark',
  );
  const item = page.locator('#comp-list li');
  await item.waitFor();
  assert.equal(await item.evaluate((el) => getComputedStyle(el, '::marker').color), LIGHT.accent);

}

async function checkRecipes(page: SpecPage): Promise<void> {
  // Recipes: boolean axis plus defaults on the card, compounds plus the
  // hover leaf on the chip. Hover itself is sheet-proven (no SpecPage hover).
  const raised = page.locator('#recipe-card-raised');
  await raised.waitFor();
  assert.equal(await raised.evaluate((el) => getComputedStyle(el).borderTopWidth), '1px');
  assert.equal(await raised.evaluate((el) => getComputedStyle(el).backgroundColor), LIGHT.panel);
  const flat = page.locator('#recipe-card-flat');
  await flat.waitFor();
  assert.equal(await flat.evaluate((el) => getComputedStyle(el).borderTopWidth), '0px');
  const combo = page.locator('#recipe-chip-combo');
  await combo.waitFor();
  assert.equal(await combo.evaluate((el) => getComputedStyle(el).backgroundColor), LIGHT.brand);
  const plain = page.locator('#recipe-chip-plain');
  await plain.waitFor();
  assert.equal(await plain.evaluate((el) => getComputedStyle(el).backgroundColor), LIGHT.accent);

}

async function checkFlip(page: SpecPage): Promise<void> {
  // Flip to dark: every semantic paint repaints; statics hold their ground.
  const html = page.locator('html');
  await html.waitFor();
  await html.evaluate((el) => el.setAttribute('data-color-mode', 'dark'));
  const dark: Array<[string, (el: HTMLElement) => string, string]> = [
    ['#comp-button', (el) => getComputedStyle(el).backgroundColor, DARK.brand],
    ['#comp-button', (el) => getComputedStyle(el).color, DARK.buttonInk],
    ['#comp-field-input', (el) => getComputedStyle(el).color, DARK.ink],
    ['#comp-file', (el) => getComputedStyle(el).color, DARK.ink],
    ['#comp-disc-summary', (el) => getComputedStyle(el).color, DARK.ink],
    ['#comp-table-cell', (el) => getComputedStyle(el).color, DARK.ink],
    ['#comp-link', (el) => getComputedStyle(el).color, DARK.accent],
    ['#recipe-card-raised', (el) => getComputedStyle(el).backgroundColor, DARK.panel],
    ['#comp-field', (el) => getComputedStyle(el).borderTopColor, LIGHT.fieldBorder],
  ];
  for (const [selector, read, expected] of dark) {
    const node = page.locator(selector);
    await node.waitFor();
    assert.equal(await node.evaluate(read), expected, `${selector} repaints`);
  }

  // Flip back: the light paints return, proving the flip repaints both ways.
  await html.evaluate((el) => el.setAttribute('data-color-mode', 'light'));
  const button = page.locator('#comp-button');
  await button.waitFor();
  assert.equal(await button.evaluate((el) => getComputedStyle(el).backgroundColor), LIGHT.brand);
  const link = page.locator('#comp-link');
  await link.waitFor();
  assert.equal(await link.evaluate((el) => getComputedStyle(el).color), LIGHT.accent);
}

export default async function run({ page }: SpecInput): Promise<void> {
  await checkButton(page);
  await checkField(page);
  await checkRest(page);
  await checkRecipes(page);
  await checkFlip(page);
}
