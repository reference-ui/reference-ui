// layered-component.spec.ts — spec for NEO-LAYERS-09, the layered-component case.
// Takes { page, url, case } with the consumer world synced standalone. It syncs the up
// upstream for real, copies its published react entry where the page imports it from,
// lists the upstream under layers and re-syncs, then loads the page once per color-mode
// leg and reads the upstream probe inside the consumer primitive. Restores the canonical
// config in a finally. Emits nothing on success; throws naming the failed assertion.
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

interface Leg {
  label: string;
  query: string;
  htmlMode: string | null;
  paint: string;
}

interface Reading {
  htmlMode: string | null;
  rootStamp: string | null;
  innerStamp: string | null;
  upFound: boolean;
  upStamp: string | null;
  upColor: string;
}

const OWN = 'neo-layers9';
const UP = 'neo-layers9-up';
const UP_INK_CLASS = `${UP}__c_upInk`;

// Computed colours of the upstream token: rgb() of #be185d (light leaf) and #f9a8d4 (dark leaf).
const LIGHT_RGB = 'rgb(190, 24, 93)';
const DARK_RGB = 'rgb(249, 168, 212)';

// Where the spec copies the upstream's published react entry inside the world. The page's
// importmap maps the bare name neo-layers9-up to this path (see world/index.html).
const UP_REACT_COPY = path.join('.reference-ui', 'upstream', 'react.mjs');

const CONFIG_IMPORT = "import { defineConfig } from '@reference-ui/neo'";
const UP_IMPORT =
  "import { baseSystem as upUpstream } from '../upstreams/up/.reference-ui/system/baseSystem.mjs'";
const EMPTY_EXTENDS = 'extends: [],';

// Three legs, one page load each. The query string sets html data-color-mode before render.
const LEGS: readonly Leg[] = [
  { label: 'no html data-color-mode', query: '', htmlMode: null, paint: LIGHT_RGB },
  { label: 'html data-color-mode="light"', query: '?mode=light', htmlMode: 'light', paint: LIGHT_RGB },
  { label: 'html data-color-mode="dark" (dark mode)', query: '?mode=dark', htmlMode: 'dark', paint: DARK_RGB },
];

// Lists the up upstream under layers; a missing anchor means the canonical config changed shape.
function toLayeredConfig(canonical: string): string {
  const withImport = canonical.replace(CONFIG_IMPORT, `${CONFIG_IMPORT}\n${UP_IMPORT}`);
  if (withImport === canonical) throw new Error('canonical ui.config lost its neo import');
  const layered = withImport.replace(EMPTY_EXTENDS, 'extends: [],\n  layers: [upUpstream],');
  if (layered === withImport) throw new Error('canonical ui.config lost its empty extends');
  return layered;
}

// The upstream block opens the layered section, and its utility rule lands before the own block.
// Sub-layers (reset, tokens, utilities) print unindented inside each block, so the span runs from
// one block header to the next block header, never to a line that merely starts with @layer.
function assertSheet(styles: string): void {
  const up = styles.indexOf(`@layer ${UP} {`);
  assert.ok(up >= 0, `served sheet carries the @layer ${UP} block`);
  const ownAt = styles.indexOf(`@layer ${OWN} {`, up);
  const end = ownAt >= 0 ? ownAt : styles.length;
  const at = styles.indexOf(`.${UP_INK_CLASS} {`, up);
  assert.ok(
    at > up && at < end,
    `layers block carries .${UP_INK_CLASS} (at ${at}, block ${up}..${end})`,
  );
}

// One DOM read of the consumer root: the html mode, both consumer stamps, and the upstream
// probe's stamp and computed ink, all from the same page state.
async function readLeg(page: SpecPage): Promise<Reading> {
  const root = page.locator('#consumer-root');
  await root.waitFor();
  return root.evaluate((el) => {
    const up = el.querySelector<HTMLElement>('#up-probe');
    const inner = el.querySelector<HTMLElement>('#consumer-inner');
    return {
      htmlMode: document.documentElement.getAttribute('data-color-mode'),
      rootStamp: el.getAttribute('data-layer'),
      innerStamp: inner ? inner.getAttribute('data-layer') : null,
      upFound: up !== null,
      upStamp: up ? up.getAttribute('data-layer') : null,
      upColor: up ? getComputedStyle(up).color : '',
    };
  });
}

// The upstream component stamps its own layer and paints its own token at the top of its tree,
// inside the consumer primitive. A same-system primitive keeps today's rule: stamped with no
// color mode in effect, unstamped under one.
function assertLeg(reading: Reading, leg: Leg): void {
  assert.equal(reading.htmlMode, leg.htmlMode, `${leg.label}: html carries the leg's color mode`);
  assert.equal(reading.rootStamp, OWN, `${leg.label}: the consumer primitive stamps ${OWN}`);
  assert.ok(reading.upFound, `${leg.label}: the upstream probe renders inside the consumer primitive`);
  assert.equal(
    reading.upStamp,
    UP,
    `${leg.label}: the upstream component stamps its own data-layer, got ${reading.upStamp}`,
  );
  assert.equal(
    reading.upColor,
    leg.paint,
    `${leg.label}: the upstream component paints its own token, got ${reading.upColor}`,
  );
  const innerStamp = leg.htmlMode === null ? OWN : null;
  assert.equal(
    reading.innerStamp,
    innerStamp,
    `${leg.label}: a same-system primitive keeps today's stamp rule, got ${reading.innerStamp}`,
  );
}

// Syncs the upstream for real, lists it under layers, re-syncs, copies its react entry into the
// world, then reads each leg. Restores the canonical config and re-syncs in the finally.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  const upDir = path.join(c.dir, 'upstreams', 'up');
  const upReactSource = path.join(upDir, '.reference-ui', 'react', 'react.mjs');

  await sync(upDir);
  const upReact = fs.readFileSync(upReactSource, 'utf8');
  assert.ok(upReact.includes(UP), `upstream publishes a react entry bound to ${UP}`);

  fs.writeFileSync(configPath, toLayeredConfig(canonical), 'utf8');
  try {
    await sync(c.worldDir);
    const styles = fs.readFileSync(
      path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css'),
      'utf8',
    );
    assertSheet(styles);
    const copy = path.join(c.worldDir, UP_REACT_COPY);
    fs.mkdirSync(path.dirname(copy), { recursive: true });
    fs.copyFileSync(upReactSource, copy);
    for (const leg of LEGS) {
      await page.goto(`${url}${leg.query}`, { waitUntil: 'load' });
      assertLeg(await readLeg(page), leg);
    }
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(c.worldDir);
  }
}
