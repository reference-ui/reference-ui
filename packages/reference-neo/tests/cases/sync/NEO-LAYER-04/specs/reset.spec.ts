// reset.spec.ts — spec for NEO-LAYER-04, the normalizeCss reset case. Takes
// { page, case } from the runner with the default-flag world freshly synced.
// Emits nothing on success; throws naming the unpainted reset rule, the
// misplaced layer, or the twin world that keeps reset against its flag.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface FrozenRequest {
  spec: { globalCss: Array<{ source: string }> };
}

// The served world leaves normalizeCss at its default: the sheet opens with
// the reset body ahead of tokens and utilities, the reset fragment rides the
// compiled spec, and the browser agrees — the classless div computes
// border-box while the bare heading loses its UA margin. A normalizeCss:false
// twin synced node-side keeps the six-name preamble but prints no reset.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(
    styles.includes('@layer reset, global, base, tokens, recipes, utilities;'),
    'sheet names all six layers in rank order',
  );
  const resetOpen = styles.indexOf('@layer reset {');
  assert.ok(resetOpen !== -1, 'default world prints the reset body');
  const tokensOpen = styles.indexOf('@layer tokens {');
  const utilitiesOpen = styles.indexOf('@layer utilities {');
  assert.ok(
    resetOpen < tokensOpen && tokensOpen < utilitiesOpen,
    'reset opens ahead of tokens and utilities',
  );

  const request = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system/compile-request.json'), 'utf8'),
  ) as FrozenRequest;
  const firstFragment = request.spec.globalCss[0] as { source: string } | undefined;
  assert.equal(
    firstFragment?.source,
    'normalizeCss/reset',
    'reset content rides the compiled spec first',
  );

  const plain = page.locator('#plain');
  await plain.waitFor();
  assert.equal(
    await plain.evaluate((el) => getComputedStyle(el).boxSizing),
    'border-box',
    'classless div computes the reset box-sizing',
  );
  const title = page.locator('#title');
  await title.waitFor();
  assert.equal(
    await title.evaluate((el) => getComputedStyle(el).marginTop),
    '0px',
    'bare heading loses its UA margin to the reset',
  );

  const dir = fs.mkdtempSync(path.join(tmpdir(), 'neo-layer4-'));
  try {
    fs.cpSync(path.join(c.worldDir, 'theme'), path.join(dir, 'theme'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'ui.config.ts'),
      [
        "import { defineConfig } from '@reference-ui/neo'",
        '',
        'export default defineConfig({',
        "  name: 'neo-layer4-twin',",
        "  include: ['theme/**/*.{ts,tsx}'],",
        '  normalizeCss: false,',
        '})',
        '',
      ].join('\n'),
    );
    await sync(dir);
    const twin = fs.readFileSync(path.join(dir, '.reference-ui/styled/styles.css'), 'utf8');
    assert.ok(
      twin.includes('@layer reset, global, base, tokens, recipes, utilities;'),
      'false twin keeps the six-name preamble',
    );
    assert.ok(!twin.includes('@layer reset {'), 'false flag omits the reset body');
    assert.ok(!twin.includes('box-sizing: border-box'), 'false flag drops the reset rules');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
