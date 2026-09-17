// extends.spec.ts — spec for NEO-SYNC-10, the extends-adoption case. Takes
// { page, case } from the runner with the world freshly synced and asserts
// computed style plus the merged artifacts. Emits nothing on success; throws
// naming the unpainted probe or the merged field that keeps the wrong side.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function computedColor(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => getComputedStyle(el).color);
}

// The runner synced this two-system world before serving: the upstream token
// paints, the local override wins the shared leaf, and a local recipe over
// the upstream token paints — with the merged artifacts pinned node-side.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const up = await computedColor(page, '#up-probe');
  assert.equal(up, 'rgb(255, 255, 255)', `upstream token paints the probe, got ${up}`);

  const shared = await computedColor(page, '#shared-probe');
  assert.equal(shared, 'rgb(34, 34, 34)', `local override wins the shared leaf, got ${shared}`);

  const card = await computedColor(page, '#card-probe');
  assert.equal(card, 'rgb(255, 255, 255)', `recipe over the upstream token paints, got ${card}`);

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
  ) as { tokens: { colors: unknown } };
  assert.deepEqual(
    evaluated.tokens.colors,
    { up: { value: '#ffffff' }, shared: { value: '#222222' } },
    'evaluated tokens merge upstream with the local override winning',
  );

  const jsx = JSON.parse(fs.readFileSync(path.join(outDir, 'system', 'jsx-elements.json'), 'utf8')) as {
    primitives: string[];
    upstream: string[];
    local: string[];
    merged: string[];
  };
  assert.deepEqual(
    jsx,
    {
      primitives: [],
      upstream: ['UpstreamCard'],
      local: ['LocalPanel'],
      merged: ['LocalPanel', 'UpstreamCard'],
    },
    'jsx hosts merge upstream and local',
  );
}
