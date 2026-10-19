// nested-scope.spec.ts — spec for CORE-LAYERS-20, token scope through a chain of packages. It takes
// { page, url, case } with the world synced standalone, syncs package a for real, rewrites package b to extend a
// and syncs it, then composes b into the app under extends and under layers in turn, re-syncing each time. Each leg
// reads a's Badge on its own, b's Card and a's Badge inside it by computed background, beside the stamp lists in
// b's published entry and in the app's sheet. Emits nothing on success; throws one line naming every wrong reading.
// Every canonical config is restored with a heal sync in a finally.
import fs from 'node:fs';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import {
  blockSpan,
  readSheet,
  restoreWorld,
  syncUpstream,
  wireConfig,
  writeConfig,
  type PublishedBaseSystem,
  type Wiring,
} from '../../shared/upstream.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: CoreCase;
}

type Bucket = 'extends' | 'layers';

const OWN = 'core-layers20';
const A = 'core-layers20-a';
const B = 'core-layers20-b';

// Computed backgrounds of the brands that should win: b's #b45309 and the app's #15803d. a's own #7e22ce
// (rgb(126, 34, 206)) never should, once a's stamps are claimed.
const B_BRAND = 'rgb(180, 83, 9)';
const APP_BRAND = 'rgb(21, 128, 61)';

// Whose brand paints inside each package element: the app's under extends, b's under layers, where b keeps its own
// values, and b's values include its override of a's brand.
const EXPECTED: Record<Bucket, Record<string, string>> = {
  extends: { 'a-direct': APP_BRAND, 'b-card': APP_BRAND, 'a-in-b': APP_BRAND },
  layers: { 'a-direct': B_BRAND, 'b-card': B_BRAND, 'a-in-b': B_BRAND },
};

// The stamps each probe carries: its own package's name.
const STAMP: Record<string, string> = { 'a-direct': A, 'b-card': B, 'a-in-b': A };

function stampsOf(name: string): string {
  return `[data-layer="${name}"], [data-layer="${name}"][data-color-mode=light]`;
}

function wiringFor(bucket: Bucket): Wiring {
  const binding = 'bBase';
  return {
    links: [{ binding, from: './upstream/b/.reference-ui/system/baseSystem.mjs' }],
    extends: bucket === 'extends' ? [binding] : [],
    layers: bucket === 'layers' ? [binding] : [],
  };
}

// b extends a, so b's published own entry claims a's stamps after its own.
function publishedProblems(b: PublishedBaseSystem): string[] {
  const own = b.streams?.find((stream) => stream.name === B)?.tokensPortable ?? '';
  return own.includes(`${stampsOf(B)}, ${stampsOf(A)} {`) ? [] : [`b's published tokens do not claim a's stamps`];
}

// Under extends the app's own token rule claims a's and b's stamps; under layers it claims neither.
function sheetProblems(styles: string, bucket: Bucket): string[] {
  const own = blockSpan(styles, OWN);
  const claimed = styles.indexOf(`${stampsOf(OWN)}, ${stampsOf(A)}, ${stampsOf(B)} {`, own.from) > own.from;
  const unclaimed = styles.indexOf(`${stampsOf(OWN)} {`, own.from) > own.from;
  const fine = bucket === 'extends' ? claimed : unclaimed;
  return fine ? [] : [`${bucket}: the own token rule names the wrong stamps`];
}

async function probeProblems(page: SpecPage, bucket: Bucket): Promise<string[]> {
  const problems: string[] = [];
  for (const [id, expected] of Object.entries(EXPECTED[bucket])) {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    const { stamp, bg } = await node.evaluate((el) => ({
      stamp: el.getAttribute('data-layer'),
      bg: getComputedStyle(el).backgroundColor,
    }));
    if (stamp !== STAMP[id]) problems.push(`${bucket}: #${id} stamps ${stamp}, expected ${STAMP[id]}`);
    if (bg !== expected) problems.push(`${bucket}: #${id} paints ${bg}, expected ${expected}`);
  }
  return problems;
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const upstream = (name: string): string => path.join(c.worldDir, 'upstream', name);
  const canonical = fs.readFileSync(path.join(c.worldDir, 'ui.config.ts'), 'utf8');
  const canonicalB = fs.readFileSync(path.join(upstream('b'), 'ui.config.ts'), 'utf8');
  const aLink = { binding: 'aBase', from: '../a/.reference-ui/system/baseSystem.mjs' };

  try {
    await syncUpstream(upstream('a'));
    writeConfig(upstream('b'), wireConfig(canonicalB, { links: [aLink], extends: ['aBase'], layers: [] }));
    const problems = publishedProblems(await syncUpstream(upstream('b')));
    for (const bucket of ['extends', 'layers'] as const) {
      writeConfig(c.worldDir, wireConfig(canonical, wiringFor(bucket)));
      await sync(c.worldDir);
      problems.push(...sheetProblems(readSheet(c.worldDir), bucket));
      await page.goto(`${url}?bucket=${bucket}`, { waitUntil: 'load' });
      problems.push(...(await probeProblems(page, bucket)));
    }
    if (problems.length > 0) throw new Error(`CORE-LAYERS-20 broke: ${problems.join('; ')}`);
  } finally {
    await restoreWorld(upstream('b'), canonicalB);
    await restoreWorld(c.worldDir, canonical);
  }
}
