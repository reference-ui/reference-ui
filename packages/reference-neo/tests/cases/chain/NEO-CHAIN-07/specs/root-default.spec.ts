// root-default.spec.ts — spec for NEO-CHAIN-07, the root-default chain case.
// Takes { page, url, case } with the world synced standalone, then syncs a
// real upstream defining `--spacing-root: 0.5rem`, extends it, and re-syncs;
// finally it rewrites the consumer theme to override `1rem` and re-syncs.
// Emits nothing on success; throws naming the phase whose computed root or
// painted rhythm missed its oracle on failure.
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

const ROOT_DEFAULT = '@layer root {\n  :root { --spacing-root: 0.25rem }\n}\n';
const FORMULA = 'max-width: calc(140 * var(--spacing-root));';

const OVERRIDE_THEME = `// Local fragment for the NEO-CHAIN-07 world (override phase). It takes the
// neo fragment collector and emits the consumer \`:root\` of \`1rem\`: the top
// of the precedence chain, beating the upstream author and the baked default.
import { globalCss } from '@reference-ui/neo'

globalCss({
  ':root': { '--spacing-root': '1rem' },
  body: { color: '#111111' },
})
`;

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function readStyles(worldDir: string): string {
  return fs.readFileSync(path.join(worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
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

async function rootOf(page: SpecPage): Promise<[string, string]> {
  const probe = page.locator('#rhythm');
  await probe.waitFor();
  const root = await page.locator('html').evaluate(
    (el) => getComputedStyle(el).getPropertyValue('--spacing-root').trim(),
  );
  const width = await probe.evaluate((el) => getComputedStyle(el).maxWidth);
  return [root, width];
}

// Standalone: no author `:root` anywhere, so the baked default applies and
// the static `140r` probe paints `140 * 0.25rem`.
async function phaseStandalone(page: SpecPage, worldDir: string): Promise<void> {
  const styles = readStyles(worldDir);
  assert.ok(styles.startsWith(ROOT_DEFAULT), 'standalone sheet opens with the baked default');
  assert.ok(styles.includes(FORMULA), 'standalone sheet carries the 140r formula');
  assert.equal(
    countOccurrences(styles, '--spacing-root:'),
    1,
    'standalone sheet defines the root exactly once',
  );
  const [root, width] = await rootOf(page);
  assert.equal(root, '0.25rem', `standalone root applies, got ${root}`);
  assert.equal(width, '560px', `standalone probe paints 140r at root, got ${width}`);
}

// Extended: the real upstream's author `0.5rem` beats the downstream baked
// default; the merge hoists exactly one root block ahead of the statement.
async function phaseExtended(page: SpecPage, url: string, worldDir: string): Promise<void> {
  const upstreamDir = path.join(worldDir, 'upstream');
  await sync(upstreamDir);
  const configPath = path.join(worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  fs.writeFileSync(configPath, toExtendedConfig(canonical), 'utf8');
  await sync(worldDir);

  const styles = readStyles(worldDir);
  assert.ok(styles.startsWith(ROOT_DEFAULT), 'extended sheet hoists the baked default first');
  assert.ok(
    styles.includes('@layer neo-chain7-up, neo-chain7;'),
    'extended sheet states upstream before self',
  );
  assert.equal(
    countOccurrences(styles, '@layer root {'),
    1,
    'extended sheet prints exactly one root block',
  );
  assert.ok(styles.includes('--spacing-root: 0.5rem'), 'extended sheet carries upstream author root');
  assert.ok(
    styles.indexOf('--spacing-root: 0.5rem') < styles.indexOf('@layer neo-chain7 {'),
    'upstream author root rides the upstream block',
  );
  await page.goto(url, { waitUntil: 'load' });
  const [root, width] = await rootOf(page);
  assert.equal(root, '0.5rem', `upstream author beats the default, got ${root}`);
  assert.equal(width, '1120px', `extended probe paints 140r at upstream root, got ${width}`);
}

// Override: the consumer `:root` of `1rem` wins over upstream and default.
async function phaseOverride(page: SpecPage, url: string, worldDir: string): Promise<void> {
  const themePath = path.join(worldDir, 'theme', 'local.ts');
  fs.writeFileSync(themePath, OVERRIDE_THEME, 'utf8');
  await sync(worldDir);

  const styles = readStyles(worldDir);
  assert.ok(styles.startsWith(ROOT_DEFAULT), 'override sheet keeps the default first');
  assert.ok(styles.includes('--spacing-root: 1rem'), 'override sheet carries consumer author root');
  assert.ok(
    styles.indexOf('@layer neo-chain7 {') < styles.lastIndexOf('--spacing-root: 1rem'),
    'consumer author root rides the own block',
  );
  await page.goto(url, { waitUntil: 'load' });
  const [root, width] = await rootOf(page);
  assert.equal(root, '1rem', `consumer beats upstream and default, got ${root}`);
  assert.equal(width, '2240px', `override probe paints 140r at consumer root, got ${width}`);
}

// The runner synced this world standalone (no upstreams, no consumer root).
// Phase 1 pins the default applying; phase 2 extends the real synced
// upstream and pins its author value beating the default; phase 3 overrides
// from the consumer theme and pins the top of the chain. Canonical config
// and theme restore with a heal sync in a finally, so the tree is canonical
// whatever the run does.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const themePath = path.join(c.worldDir, 'theme', 'local.ts');
  const canonicalConfig = fs.readFileSync(configPath, 'utf8');
  const canonicalTheme = fs.readFileSync(themePath, 'utf8');
  try {
    await phaseStandalone(page, c.worldDir);
    await phaseExtended(page, url, c.worldDir);
    await phaseOverride(page, url, c.worldDir);
  } finally {
    fs.writeFileSync(configPath, canonicalConfig, 'utf8');
    fs.writeFileSync(themePath, canonicalTheme, 'utf8');
    await sync(c.worldDir);
  }
}
