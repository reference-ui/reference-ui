// focus-visible.spec.ts — spec for NEO-GLOBAL-01, the literal :focus-visible case.
// Takes { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// literal rule, the unexpected twin, or the unpainted outline on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authored one literal :focus-visible rule with a token ref. The sheet
// carries it verbatim in @layer global with no :is() twin, and visible focus
// paints the token colour plus the literal offset on the probe.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const ruleOpen = styles.indexOf('.ref-probe:focus-visible', globalOpen);
  assert.ok(ruleOpen !== -1, 'global layer carries the literal :focus-visible selector');
  const ruleClose = styles.indexOf('}', ruleOpen);
  const rule = styles.slice(ruleOpen, ruleClose);
  assert.ok(!rule.includes(':is('), `literal selector gains no twin, got ${rule}`);
  assert.ok(
    rule.includes('outline-color: var(--colors-ui-focus-ring)'),
    `rule carries the token var, got ${rule}`,
  );
  assert.ok(rule.includes('outline-offset: 2px'), `rule carries the offset, got ${rule}`);

  const probe = page.locator('#probe');
  await probe.waitFor();
  const before = await probe.evaluate((el) => getComputedStyle(el).outlineColor);
  assert.notEqual(before, 'rgb(124, 58, 237)', `unfocused probe carries no token colour, got ${before}`);

  const matched = await probe.evaluate((el) => {
    (el as HTMLElement).focus({ focusVisible: true });
    return (el as HTMLElement).matches(':focus-visible');
  });
  assert.equal(matched, true, 'probe matches :focus-visible after visible focus');

  const color = await probe.evaluate((el) => getComputedStyle(el).outlineColor);
  assert.equal(color, 'rgb(124, 58, 237)', `visible focus paints the token colour, got ${color}`);
  const offset = await probe.evaluate((el) => getComputedStyle(el).outlineOffset);
  assert.equal(offset, '2px', `visible focus paints the offset, got ${offset}`);
}
