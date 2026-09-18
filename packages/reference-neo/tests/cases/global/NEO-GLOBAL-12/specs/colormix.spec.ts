// colormix.spec.ts — spec for NEO-GLOBAL-12, the hover color-mix case.
// Takes { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the unresolved
// mix, the missing twin, or the mismatched computed paint on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authored a button base plus hover and active mixes with brace-token
// colours. The sheet carries both mixes with var() refs inside the function on
// the twin selectors in @layer global, and each twin paints computed exactly
// like its hex reference element: the hover background and the press ring.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);

  const hoverOpen = globalLayer.indexOf('.ref-button:is(:hover, [data-hover])');
  assert.ok(hoverOpen !== -1, 'global layer carries the hover twin');
  const hoverRule = globalLayer.slice(hoverOpen, globalLayer.indexOf('}', hoverOpen));
  assert.ok(
    hoverRule.includes(
      'background-color: color-mix(in oklch, var(--colors-ui-table-row-muted) 80%, var(--colors-gray-300))',
    ),
    `hover rule mixes the token vars, got ${hoverRule}`,
  );

  const activeOpen = globalLayer.indexOf('.ref-button:is(:active, [data-active])');
  assert.ok(activeOpen !== -1, 'global layer carries the active twin');
  const activeRule = globalLayer.slice(activeOpen, globalLayer.indexOf('}', activeOpen));
  assert.ok(
    activeRule.includes(
      'box-shadow: 0 0 0 4px color-mix(in oklch, var(--colors-ui-table-row-muted) 15.2%, transparent)',
    ),
    `active rule carries the press ring, got ${activeRule}`,
  );

  async function backgroundOf(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).backgroundColor);
  }

  async function shadowOf(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).boxShadow);
  }

  const base = await backgroundOf('#base');
  assert.equal(base, 'rgb(243, 244, 246)', `base paints the muted token, got ${base}`);

  const hovered = await backgroundOf('#hovered');
  const hoverRef = await backgroundOf('#hover-ref');
  assert.notEqual(hovered, base, `hover twin leaves the base colour, got ${hovered}`);
  assert.equal(hovered, hoverRef, `hover twin matches the hex mix, got ${hovered} vs ${hoverRef}`);

  const pressed = await shadowOf('#pressed');
  const pressRef = await shadowOf('#press-ref');
  assert.notEqual(pressed, 'none', `active twin paints a press ring, got ${pressed}`);
  assert.equal(pressed, pressRef, `press ring matches the hex mix, got ${pressed} vs ${pressRef}`);
}
