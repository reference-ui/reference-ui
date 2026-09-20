// extends-private.spec.ts — spec for NEO-SYNC-17, the upstream-private-strip case. Takes
// { page, case } from the runner with the two-system world freshly synced and asserts
// the extends boundary: upstream _private stays out of the merged tokens, provenance,
// and generated types, while the upstream public token and the downstream's own
// _private still paint. Emits nothing on success; throws naming the leaked path.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface ProvenanceEntry {
  source: string;
  kind: string;
  keys?: string[];
}

async function computedColor(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => getComputedStyle(el).color);
}

// The runner synced this two-system world before serving: the upstream public
// token paints, the downstream's own _private paints, and the upstream's
// _private (nested secret plus top-level vault category) appears nowhere —
// not in the merged tokens, not in provenance, not in the generated types.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const up = await computedColor(page, '#up-probe');
  assert.equal(up, 'rgb(255, 255, 255)', `upstream public token paints the probe, got ${up}`);

  const own = await computedColor(page, '#own-probe');
  assert.equal(own, 'rgb(255, 0, 255)', `downstream own _private paints the probe, got ${own}`);

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
  ) as { tokens: Record<string, unknown>; provenance: ProvenanceEntry[] };

  assert.deepEqual(
    evaluated.tokens.colors,
    {
      up: { value: '#ffffff' },
      own: { value: '#222222' },
      _private: { ownSecret: { value: '#ff00ff' } },
    },
    'merged colors drop the upstream secret but keep the downstream own secret',
  );
  assert.ok(
    !('_private' in evaluated.tokens),
    'no top-level _private category leaks from upstream',
  );
  assert.ok(
    !JSON.stringify(evaluated.tokens).includes('upstreamSecret'),
    'no upstream secret survives anywhere in the merged tokens',
  );

  const upstreamEntry = evaluated.provenance.find(
    (entry) => entry.source === 'upstream-lib' && entry.kind === 'tokens',
  );
  assert.ok(upstreamEntry, 'upstream tokens provenance entry exists');
  assert.deepEqual(
    upstreamEntry.keys,
    ['colors.up'],
    'upstream provenance carries the public path only',
  );
  for (const entry of evaluated.provenance) {
    for (const key of entry.keys ?? []) {
      assert.ok(
        !key.includes('upstreamSecret') && key !== '_private.vault',
        `provenance advertises no upstream private path, got ${entry.source}:${key}`,
      );
    }
  }
  const localEntry = evaluated.provenance.find(
    (entry) => entry.source === 'theme/tokens.ts' && entry.kind === 'tokens',
  );
  assert.ok(localEntry, 'local tokens provenance entry exists');
  assert.deepEqual(
    localEntry.keys,
    ['colors.own', 'colors._private.ownSecret'],
    'local provenance keeps the own-secret path',
  );

  const types = fs.readFileSync(
    path.join(outDir, 'styled', 'types', 'index.d.ts'),
    'utf8',
  );
  assert.ok(
    !types.includes('upstreamSecret'),
    'generated types lack the upstream private path',
  );
  assert.ok(
    types.includes("'_private.ownSecret'"),
    'generated types still declare the downstream own-secret path',
  );
}
