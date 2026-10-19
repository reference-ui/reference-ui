// token-scope.spec.ts — spec for CORE-LAYERS-19, whose token values paint inside a package's components. It takes
// { page, url, case } with the world synced standalone, syncs the acme upstream for real, then composes it under
// extends and under layers in turn; each composition re-syncs and loads the page in light and dark. Each leg reads
// the own control, acme's self-styled Badge and the app-styled Plain by computed style, beside the own token
// selector in the served sheet. Emits nothing on success; throws one line naming every wrong reading. The canonical
// config is restored with a heal sync in a finally.
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
  type Wiring,
} from '../../shared/upstream.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: CoreCase;
}

type Bucket = 'extends' | 'layers';
type Mode = 'light' | 'dark';

/** One element's stamp and the three computed colours the probes read. */
interface Reading {
  stamp: string | null;
  bg: string;
  color: string;
  border: string;
}

// Playwright's console surface, narrowed to the one member this spec reads: a runtime class miss lands on
// console.warn as "no compiled class".
interface ConsoleMessage {
  text(): string;
}
interface ConsolePage extends SpecPage {
  on(event: 'console', handler: (message: ConsoleMessage) => void): void;
}

const OWN = 'core-layers19';
const ACME = 'core-layers19-acme';
const BINDING = 'acmeBase';
const BASE_FROM = './upstream/.reference-ui/system/baseSystem.mjs';

// Computed colours as the browser serialises them, light then dark: the app's brand (#15803d, #86efac), acme's
// brand (#be185d, #f9a8d4), acme's public acmeOnly (#1d4ed8, #93c5fd) and private seal (#7c3aed, #c4b5fd).
const APP_BRAND: Record<Mode, string> = { light: 'rgb(21, 128, 61)', dark: 'rgb(134, 239, 172)' };
const ACME_BRAND: Record<Mode, string> = { light: 'rgb(190, 24, 93)', dark: 'rgb(249, 168, 212)' };
const ACME_ONLY: Record<Mode, string> = { light: 'rgb(29, 78, 216)', dark: 'rgb(147, 197, 253)' };
const ACME_SEAL: Record<Mode, string> = { light: 'rgb(124, 58, 237)', dark: 'rgb(196, 181, 253)' };

// The ruling: under extends the app's brand wins inside acme's components, under layers acme keeps its own.
const BRAND_INSIDE_ACME: Record<Bucket, Record<Mode, string>> = { extends: APP_BRAND, layers: ACME_BRAND };

// The stamps acme's elements carry, as the own token selector names them when the app claims them.
const ACME_STAMPS = `[data-layer="${ACME}"], [data-layer="${ACME}"][data-color-mode=light]`;

function wiringFor(bucket: Bucket): Wiring {
  return {
    links: [{ binding: BINDING, from: BASE_FROM }],
    extends: bucket === 'extends' ? [BINDING] : [],
    layers: bucket === 'layers' ? [BINDING] : [],
  };
}

async function read(page: SpecPage, id: string): Promise<Reading> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      stamp: el.getAttribute('data-layer'),
      bg: style.backgroundColor,
      color: style.color,
      border: style.borderTopColor,
    };
  });
}

// One comparison: pushes a line naming the leg, the probe and both values when they differ.
function expectEqual(problems: string[], what: string, actual: string | null, expected: string): void {
  if (actual !== expected) problems.push(`${what} is ${actual}, expected ${expected}`);
}

// The own token block claims acme's stamps under extends and never under layers.
function sheetProblems(styles: string, bucket: Bucket): string[] {
  const own = blockSpan(styles, OWN);
  const at = styles.indexOf(ACME_STAMPS, own.from);
  const claimed = own.from >= 0 && at > own.from && at < own.to;
  if (claimed === (bucket === 'extends')) return [];
  const verb = claimed ? 'claims' : 'does not claim';
  return [`${bucket}: the own token block ${verb} acme's stamps`];
}

// One leg: the control paints the app's brand, acme's Badge paints the bucket's brand with acme's own acmeOnly and
// seal, and the app's bg on Plain paints the bucket's brand. Both acme probes keep acme's stamp.
async function legProblems(page: SpecPage, bucket: Bucket, mode: Mode): Promise<string[]> {
  const label = `${bucket} ${mode}`;
  const problems: string[] = [];
  const control = await read(page, 'app-control');
  expectEqual(problems, `${label}: the own control's background`, control.bg, APP_BRAND[mode]);
  const badge = await read(page, 'acme-internal');
  expectEqual(problems, `${label}: Badge's stamp`, badge.stamp, ACME);
  expectEqual(problems, `${label}: Badge's own bg="brand"`, badge.bg, BRAND_INSIDE_ACME[bucket][mode]);
  expectEqual(problems, `${label}: Badge's acmeOnly colour`, badge.color, ACME_ONLY[mode]);
  expectEqual(problems, `${label}: Badge's _private.seal border`, badge.border, ACME_SEAL[mode]);
  const plain = await read(page, 'acme-app-prop');
  expectEqual(problems, `${label}: Plain's stamp`, plain.stamp, ACME);
  expectEqual(problems, `${label}: the app's bg="brand" on Plain`, plain.bg, BRAND_INSIDE_ACME[bucket][mode]);
  return problems;
}

async function bucketProblems(page: SpecPage, url: string, worldDir: string, bucket: Bucket): Promise<string[]> {
  const problems = sheetProblems(readSheet(worldDir), bucket);
  for (const mode of ['light', 'dark'] as const) {
    await page.goto(`${url}?mode=${mode}&bucket=${bucket}`, { waitUntil: 'load' });
    problems.push(...(await legProblems(page, bucket, mode)));
  }
  return problems;
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = fs.readFileSync(path.join(c.worldDir, 'ui.config.ts'), 'utf8');
  const misses: string[] = [];
  (page as unknown as ConsolePage).on('console', (message) => {
    if (message.text().includes('no compiled class')) misses.push(message.text());
  });

  try {
    const published = await syncUpstream(path.join(c.worldDir, 'upstream'));
    const problems = published.name === ACME ? [] : [`acme publishes ${published.name}, not ${ACME}`];
    for (const bucket of ['extends', 'layers'] as const) {
      writeConfig(c.worldDir, wireConfig(canonical, wiringFor(bucket)));
      await sync(c.worldDir);
      problems.push(...(await bucketProblems(page, url, c.worldDir, bucket)));
    }
    if (misses.length > 0) problems.push(`${misses.length} runtime miss(es), first: ${misses[0]}`);
    if (problems.length > 0) throw new Error(`CORE-LAYERS-19 broke: ${problems.join('; ')}`);
  } finally {
    await restoreWorld(c.worldDir, canonical);
  }
}
