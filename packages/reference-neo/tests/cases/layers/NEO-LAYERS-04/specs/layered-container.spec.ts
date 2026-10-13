// layered-container.spec.ts — spec for NEO-LAYERS-04, the container-root and
// upstream-qualifier case. Takes { page, url, case } with the consumer world
// synced standalone. It syncs the upstream for real, then runs three legs over
// the same consumer (standalone, layers, extends), checking the sync diagnostics,
// the compile request, the served sheet, the published system and the computed
// paint of each. Emits nothing on success; throws naming the leg and the
// assertion that failed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync, type SyncResult } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

type Bucket = 'standalone' | 'layers' | 'extends';

interface Paint {
  container: string;
  width: string;
  foreign: string;
}

const BUCKETS: readonly Bucket[] = ['standalone', 'layers', 'extends'];
const UP = 'neo-layers4-up';
const OWN = 'neo-layers4';
const NEO_IMPORT = "import { defineConfig } from '@reference-ui/neo'";
const UP_BASE = '../upstreams/up/.reference-ui/system/baseSystem.mjs';
const UP_IMPORT = `import { baseSystem as upBaseSystem } from '${UP_BASE}'`;
const CONTAINER_CODE = 'ATM-W-MISSING-CONTAINER-ROOT';
const ROOT_DECL = 'container-type: inline-size';
const FOREIGN_OPEN = `/* foreign ${UP} */`;
const FOREIGN_RULE = `.${UP}__c_\\#15803d { color: #15803d; }`;
const ROOTED_PAINT: Paint = {
  container: 'inline-size',
  width: '60px',
  foreign: 'rgb(21, 128, 61)',
};
const BARE_PAINT: Paint = {
  container: 'normal',
  width: '50px',
  foreign: 'rgb(17, 17, 17)',
};

interface PublishedStream {
  name: string;
  global?: string;
  utilities?: string;
}

interface PublishedBaseSystem {
  name: string;
  streams?: PublishedStream[];
}

interface CompileRequestRecord {
  upstreamContainerRoot?: boolean;
  upstreamSystems?: string[];
}

function readPublished(outDir: string): PublishedBaseSystem {
  const raw = fs.readFileSync(path.join(outDir, 'system', 'baseSystem.mjs'), 'utf8');
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedBaseSystem;
}

function wiringFor(bucket: Bucket): string {
  if (bucket === 'layers') return 'extends: [],\n  layers: [upBaseSystem],';
  return 'extends: [upBaseSystem],';
}

// The canonical config imports nothing and extends nothing, so the standalone leg
// is the canonical file itself. Each upstream leg adds the import and wires the
// same upstream into one bucket.
function configFor(canonical: string, bucket: Bucket): string {
  if (bucket === 'standalone') return canonical;
  const withImport = canonical.replace(NEO_IMPORT, `${NEO_IMPORT}\n${UP_IMPORT}`);
  if (withImport === canonical) {
    throw new Error('canonical ui.config lost its neo import');
  }
  const wired = withImport.replace('extends: [],', wiringFor(bucket));
  if (wired === withImport) {
    throw new Error('canonical ui.config lost its empty extends');
  }
  return wired;
}

// The upstream must publish its root in global CSS, or the verdict under test is
// vacuous: the container-root check reads exactly that text.
function assertUpstreamPublishes(upDir: string): void {
  const up = readPublished(path.join(upDir, '.reference-ui'));
  assert.equal(up.name, UP, `upstream publishes its name, got ${up.name}`);
  const globals = (up.streams ?? []).map((s) => s.global ?? '').join('\n');
  assert.ok(globals.includes(ROOT_DECL), `upstream publishes ${ROOT_DECL}`);
}

// The sync diagnostics are the verdict: standalone warns once the consumer queries
// a container with no root, and an upstream root silences the warning under either
// bucket.
function assertDiagnostics(result: SyncResult, bucket: Bucket): void {
  const hits = result.diagnostics.filter((d) => d.code === CONTAINER_CODE);
  if (bucket === 'standalone') {
    assert.ok(hits.length > 0, `standalone sync warns ${CONTAINER_CODE}`);
    const [finding] = hits;
    assert.equal(finding.severity, 'warning', 'the container-root finding is a warning');
    assert.ok(
      finding.message.includes('no container root'),
      `warning text names the missing root, got: ${finding.message}`,
    );
    return;
  }
  assert.equal(hits.length, 0, `${bucket} sync is silent: the upstream roots it`);
}

// The compile request is the wire to the engine: it names the upstream as a
// qualifier and carries the root verdict only when an upstream is wired. Both keys
// drop from the serialized request otherwise (request.ts:50,53).
function assertRequest(worldDir: string, bucket: Bucket): void {
  const raw = fs.readFileSync(
    path.join(worldDir, '.reference-ui', 'system', 'compile-request.json'),
    'utf8',
  );
  const req = JSON.parse(raw) as CompileRequestRecord;
  if (bucket === 'standalone') {
    assert.equal(req.upstreamContainerRoot, undefined, 'standalone: no root verdict');
    assert.equal(req.upstreamSystems, undefined, 'standalone request names no upstream');
    return;
  }
  assert.equal(req.upstreamContainerRoot, true, `${bucket} request carries the verdict`);
  assert.deepEqual(req.upstreamSystems, [UP], `${bucket} request names the upstream`);
}

// The served sheet carries the upstream root and the foreign group only when an
// upstream is wired, and the root rides its own block ahead of the own one.
function assertSheet(styles: string, bucket: Bucket): void {
  const rooted = bucket !== 'standalone';
  const verb = rooted ? 'carries' : 'omits';
  assert.equal(styles.includes(ROOT_DECL), rooted, `sheet ${verb} ${ROOT_DECL}`);
  assert.equal(styles.includes(FOREIGN_OPEN), rooted, `sheet ${verb} the foreign group`);
  assert.equal(styles.includes(FOREIGN_RULE), rooted, `sheet ${verb} the foreign rule`);
  if (!rooted) return;
  assert.ok(styles.includes(`@layer ${UP}, ${OWN};`), `sheet states ${UP} before ${OWN}`);
  assert.ok(
    styles.indexOf(ROOT_DECL) < styles.indexOf(`@layer ${OWN} {`),
    'the root rides the upstream block, ahead of the own block',
  );
}

// The published entry is the portable one: the own foreign group is stripped from
// it, so a downstream compose never receives a foreign rule. The served sheet keeps
// the group (asserted in assertSheet), so the strip is the only difference.
function assertPublished(worldDir: string): void {
  const published = readPublished(path.join(worldDir, '.reference-ui'));
  const flat = (published.streams ?? []).map((s) => s.utilities ?? '').join('\n');
  assert.ok(!flat.includes(FOREIGN_OPEN), 'published utilities carry no foreign group');
  assert.ok(!flat.includes(FOREIGN_RULE), 'published utilities carry no foreign rule');
}

// The paint is the oracle: the container query resolves against the root only where
// the upstream roots it, and the foreign rule paints only where the upstream name is
// a qualifier of the consumer.
async function assertPaint(page: SpecPage, url: string, bucket: Bucket): Promise<void> {
  const want = bucket === 'standalone' ? BARE_PAINT : ROOTED_PAINT;
  await page.goto(`${url}?leg=${bucket}`, { waitUntil: 'load' });
  const probe = page.locator('#container-probe');
  await probe.waitFor();
  const containerType = await page
    .locator('html')
    .evaluate((el) => getComputedStyle(el).containerType);
  const width = await probe.evaluate((el) => getComputedStyle(el).width);
  const foreign = page.locator('#foreign-probe');
  await foreign.waitFor();
  const color = await foreign.evaluate((el) => getComputedStyle(el).color);
  assert.equal(containerType, want.container, `${bucket}: html container-type`);
  assert.equal(width, want.width, `${bucket}: container probe width`);
  assert.equal(color, want.foreign, `${bucket}: foreign probe colour`);
}

// One leg: write the bucket's config, re-sync the consumer, and check every
// observable of the same consumer against that bucket's expectation.
async function runLeg(
  input: SpecInput,
  canonical: string,
  bucket: Bucket,
): Promise<void> {
  const { page, url, case: c } = input;
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  fs.writeFileSync(configPath, configFor(canonical, bucket), 'utf8');
  const result = await sync(c.worldDir);
  assertDiagnostics(result, bucket);
  assertRequest(c.worldDir, bucket);
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  assertSheet(fs.readFileSync(sheetPath, 'utf8'), bucket);
  assertPublished(c.worldDir);
  await assertPaint(page, url, bucket);
}

// Syncs the upstream for real, runs the three legs, and restores the canonical
// config with a heal sync in a finally, so the tree is canonical whatever the run does.
export default async function run(input: SpecInput): Promise<void> {
  const configPath = path.join(input.case.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  const upDir = path.join(input.case.dir, 'upstreams', 'up');
  await sync(upDir);
  assertUpstreamPublishes(upDir);
  try {
    for (const bucket of BUCKETS) {
      try {
        await runLeg(input, canonical, bucket);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`leg ${bucket}: ${message}`);
      }
    }
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(input.case.worldDir);
  }
}
