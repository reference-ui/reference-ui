// body.spec.ts — spec for NEO-GLOBAL-02, the body rhythm and container case.
// Takes { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// root var, the unpainted rhythm size, or the lost container type on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authored :root spacing vars plus body typography with a rhythm size
// and inline-size containment. The sheet carries both rules in @layer global —
// one rule per entry, rhythm lowered to calc — and the body paints the rhythm
// size with the container type while :root holds the var computed.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);
  assert.ok(
    globalLayer.includes('--spacing-root: 0.25rem'),
    'global layer carries the :root var',
  );
  const bodyOpen = globalLayer.indexOf('body {');
  assert.ok(bodyOpen !== -1, 'global layer carries the body rule');
  const bodyRule = globalLayer.slice(bodyOpen, globalLayer.indexOf('}', bodyOpen));
  assert.ok(
    bodyRule.includes('font-size: calc(4 * var(--spacing-root))'),
    `body rule lowers 4r to calc, got ${bodyRule}`,
  );
  assert.ok(
    bodyRule.includes('container-type: inline-size'),
    `body rule carries the container type, got ${bodyRule}`,
  );

  const body = page.locator('body');
  await body.waitFor();
  const fontSize = await body.evaluate((el) => getComputedStyle(el).fontSize);
  assert.equal(fontSize, '16px', `body paints the rhythm size, got ${fontSize}`);
  const containerType = await body.evaluate((el) => getComputedStyle(el).containerType);
  assert.equal(containerType, 'inline-size', `body paints the container type, got ${containerType}`);

  const probe = page.locator('#probe');
  await probe.waitFor();
  const rootVar = await probe.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--spacing-root').trim(),
  );
  assert.equal(rootVar, '0.25rem', `:root holds the var computed, got ${rootVar}`);
}
