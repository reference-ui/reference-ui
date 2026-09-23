// real-upstream.spec.ts — spec for NEO-CHAIN-06, the real-sync chain case.
// Takes { page, url, case } with the world synced standalone, then syncs the
// upstream package for real, extends its published baseSystem, and re-syncs.
// Emits nothing on success; throws naming the unadopted leaf on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

interface PublishedBaseSystem {
  name: string;
  fragment: string;
  css: string;
  jsxElements: string[];
}

function readPublishedBaseSystem(outDir: string): PublishedBaseSystem & Record<string, unknown> {
  const raw = fs.readFileSync(path.join(outDir, 'system', 'baseSystem.mjs'), 'utf8');
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedBaseSystem & Record<string, unknown>;
}

function toExtendedConfig(canonical: string): string {
  const withImport = canonical.replace(
    "import { defineConfig } from '@reference-ui/neo'",
    "import { defineConfig } from '@reference-ui/neo'\nimport { baseSystem as upstreamBaseSystem } from './upstream/.reference-ui/system/baseSystem.mjs'",
  );
  if (withImport === canonical) throw new Error('canonical ui.config lost its neo import');
  const extended = withImport.replace('extends: [],', 'extends: [upstreamBaseSystem],');
  if (extended === withImport) throw new Error('canonical ui.config lost its empty extends');
  return extended;
}

// The runner synced this world standalone (no upstreams, probes unpainted).
// The spec syncs the upstream package through the real sync(), extends the
// published artifact on disk, and re-syncs: validation passing proves the
// publish/consume shapes agree, and the adopted leaves prove the upstream
// fragment evaluated instead of dropping silently. The canonical config is
// restored with a heal sync in a finally, so the tree is canonical
// whatever the run does.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  const upstreamDir = path.join(c.worldDir, 'upstream');

  await sync(upstreamDir);
  const upstreamOut = path.join(upstreamDir, '.reference-ui');
  const upstream = readPublishedBaseSystem(upstreamOut);
  assert.equal(upstream.name, 'neo-chain6-up', `upstream publishes its name, got ${upstream.name}`);
  assert.equal(typeof upstream.fragment, 'string', 'upstream publishes the singular fragment');
  assert.ok(upstream.fragment.length > 0, 'upstream fragment is non-empty');
  assert.ok(!('fragments' in upstream), 'no plural fragments survivor in real output');
  assert.ok(!('cssChunks' in upstream), 'no plural cssChunks survivor in real output');
  assert.ok(!('runtime' in upstream), 'no duplicated runtime in real output');

  fs.writeFileSync(configPath, toExtendedConfig(canonical), 'utf8');
  try {
    await sync(c.worldDir);
    const outDir = path.join(c.worldDir, '.reference-ui');

    const evaluated = JSON.parse(
      fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
    ) as { tokens: { colors: unknown } };
    assert.deepEqual(
      evaluated.tokens.colors,
      {
        realAccent: { value: '#0ea5e9' },
        realPaper: { value: '#fef3c7' },
      },
      'evaluated tokens adopt the real upstream leaves',
    );

    const styles = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8');
    assert.ok(
      styles.includes('--colors-real-accent: #0ea5e9'),
      'downstream sheet carries the adopted accent var',
    );
    assert.ok(
      styles.includes('--colors-real-paper: #fef3c7'),
      'downstream sheet carries the adopted paper var',
    );

    const downstream = readPublishedBaseSystem(outDir);
    assert.ok(
      downstream.fragment.includes(upstream.fragment.slice(0, 200)),
      'downstream fragment republishes the real upstream fragment',
    );

    await page.goto(`${url}?real=1`, { waitUntil: 'load' });
    const copy = page.locator('#real-copy');
    await copy.waitFor();
    const copyColor = await copy.evaluate((el) => getComputedStyle(el).color);
    assert.equal(copyColor, 'rgb(14, 165, 233)', `adopted accent paints, got ${copyColor}`);

    const panel = page.locator('#real-panel');
    await panel.waitFor();
    const panelBg = await panel.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.equal(panelBg, 'rgb(254, 243, 199)', `adopted paper paints, got ${panelBg}`);
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(c.worldDir);
  }
}
