// sync.spec.ts — spec for NEO-SYNC-01, the sync skeleton handshake case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// generated file or the unpainted token color on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const EXPECTED_FILES = [
  'system/baseSystem.mjs',
  'system/baseSystem.d.mts',
  'system/evaluated-system.json',
  'system/jsx-elements.json',
  'system/package.json',
  'styled/styles.css',
  'styled/package.json',
  'react/package.json',
];

// The runner synced this world before serving: the folder shape exists on
// disk (checked node-side) and the generated sheet paints in the browser.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of EXPECTED_FILES) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `synced folder carries ${file}`);
  }
  assert.ok(
    !fs.existsSync(path.join(outDir, 'styled/global.css')),
    'D2: styled/global.css is gone; global rules live in styles.css',
  );

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer neo-sync'), 'sheet layers under the system name');
  assert.ok(styles.includes('--colors-brand: #7c3aed'), 'sheet carries the test token');

  const probe = page.locator('#probe');
  await probe.waitFor();
  const color = await probe.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(124, 58, 237)', `token paints the probe, got ${color}`);
}
