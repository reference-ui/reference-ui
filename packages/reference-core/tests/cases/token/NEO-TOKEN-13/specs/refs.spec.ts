// refs.spec.ts — spec for NEO-TOKEN-13, the keyframe-refs case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// unresolved ref, the missing calc, or the end state that fails to paint.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The keyframes print inside @layer global with both refs resolved to
// var() and both rhythm steps lowered to calc, nothing verbatim; the probe
// holds the `to` arm on first paint through the negative-delay shorthand.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalAt = styles.indexOf('@layer global');
  const framesAt = styles.indexOf('@keyframes grow');
  assert.ok(globalAt >= 0 && framesAt > globalAt, 'keyframes print inside the global layer');
  const body = styles.slice(framesAt, framesAt + 400);
  assert.ok(body.includes('var(--colors-ink)'), 'from arm resolves the ink ref to var()');
  assert.ok(body.includes('var(--colors-brand)'), 'to arm resolves the brand ref to var()');
  assert.ok(
    body.includes('calc(4 * var(--spacing-root))'),
    'from arm lowers 4r to the root calc',
  );
  assert.ok(
    body.includes('calc(8 * var(--spacing-root))'),
    'to arm lowers 8r to the root calc',
  );
  assert.ok(!body.includes('{colors'), 'keyframes carry no verbatim token refs');
  assert.ok(!/:\s*[48]r[;\s}]/.test(body), 'keyframes carry no verbatim rhythm steps');

  const probe = page.locator('#probe');
  await probe.waitFor();
  assert.equal(
    await probe.evaluate((el) => getComputedStyle(el).width),
    '32px',
    'probe holds the 8r end width',
  );
  assert.equal(
    await probe.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(124, 58, 237)',
    'probe holds the brand end color',
  );
}
