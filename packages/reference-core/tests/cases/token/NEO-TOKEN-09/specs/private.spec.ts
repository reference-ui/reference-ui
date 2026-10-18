// private.spec.ts — spec for NEO-TOKEN-09, the _private-token case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed colour missed its reference on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function styleOf(page: SpecPage, id: string): Promise<[string, string]> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.color, style.backgroundColor] as [string, string];
  });
}

// Both the name spelling and the curly-ref spelling consume the private
// var; each probe computes exactly like its inline magenta reference, and
// the owner type bundle still declares the private token path.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('--colors-_private-secret: #ff00ff'),
    'sheet declares the private token var',
  );
  assert.ok(
    styles.includes('color: var(--colors-_private-secret)'),
    'the name spelling consumes the private var',
  );
  assert.ok(
    styles.includes('background-color: var(--colors-_private-secret)'),
    'the curly-ref spelling consumes the private var',
  );
  const types = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/types/index.d.ts'),
    'utf8',
  );
  assert.ok(
    types.includes("'_private.secret'"),
    'owner types still declare the private token path',
  );

  const [probe] = await styleOf(page, 'probe');
  const [colorRef] = await styleOf(page, 'color-ref');
  assert.equal(probe, colorRef, `private name computes like its reference, got ${probe} vs ${colorRef}`);
  assert.equal(probe, 'rgb(255, 0, 255)', 'the private token paints magenta');

  const [, refProbeBg] = await styleOf(page, 'ref-probe');
  const [, bgRef] = await styleOf(page, 'bg-ref');
  assert.equal(refProbeBg, bgRef, `private curly-ref computes like its reference, got ${refProbeBg} vs ${bgRef}`);
}
