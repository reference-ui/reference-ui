// type.spec.ts — spec for NEO-TYPE-06, the no-pandacss case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// generated file that mentions @pandacss, or the unpainted probe on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const NEEDLE = '@pandacss';
const MAX_REPORT = 10;

// Every file under the generated folder, recursive. The folder is
// sync-emitted text (entries, declarations, stylesheets, manifests), so a
// plain utf8 read covers it; node_modules links live outside the outdir.
function generatedFiles(outDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(full);
    }
  };
  walk(outDir);
  return out.sort();
}

// After sync, no generated file mentions @pandacss anywhere, and the same
// world paints its brand probe.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of ['react/react.d.mts', 'styled/types/index.d.ts', 'system/system.d.mts']) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `sync published ${file}`);
  }
  const hits: string[] = [];
  for (const file of generatedFiles(outDir)) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes(NEEDLE)) hits.push(path.relative(outDir, file));
  }
  assert.equal(
    hits.length,
    0,
    `generated folder mentions ${NEEDLE} in: ${hits.slice(0, MAX_REPORT).join(', ')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
