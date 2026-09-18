// pseudo.spec.ts — spec for NEO-EDGE-01, the pseudo props case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// variant rule or the unpainted state on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Three conditions, three rules, no ghosts. Each paints through its data
// attribute twin so the spec never needs to drive real interaction.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes(':is(:hover, [data-hover])'), 'sheet carries the hover variant');
  assert.ok(styles.includes(':is(:focus, [data-focus])'), 'sheet carries the focus variant');
  assert.ok(
    styles.includes(':is(:disabled, [disabled], [data-disabled], [aria-disabled=true])'),
    'sheet carries the disabled variant',
  );
  const utilityCount = styles.match(/\.neo-edge__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const hoverable = page.locator('#hoverable');
  await hoverable.waitFor();
  const hoverColor = await hoverable.evaluate((el) => getComputedStyle(el).color);
  assert.equal(hoverColor, 'rgb(124, 58, 237)', `hover paints via data-hover, got ${hoverColor}`);

  const focusable = page.locator('#focusable');
  await focusable.waitFor();
  const focusColor = await focusable.evaluate((el) => getComputedStyle(el).color);
  assert.equal(focusColor, 'rgb(255, 255, 255)', `focus paints via data-focus, got ${focusColor}`);

  const disableable = page.locator('#disableable');
  await disableable.waitFor();
  const disabledColor = await disableable.evaluate((el) => getComputedStyle(el).color);
  assert.equal(
    disabledColor,
    'rgb(17, 17, 17)',
    `disabled paints via data-disabled, got ${disabledColor}`,
  );
}
