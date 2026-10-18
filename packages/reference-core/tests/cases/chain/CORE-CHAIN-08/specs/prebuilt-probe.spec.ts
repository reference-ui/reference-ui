// prebuilt-probe.spec.ts — spec for CORE-CHAIN-08, the prebuilt-dist fan-out
// case. Takes { page, url, case } with the world synced standalone, syncs a
// real upstream package into a materialized bound react.mjs, rewrites the
// consumer config to extend it, re-syncs, then asserts a consumer-only token
// paints on the prebuilt component fixture with zero runtime misses. Emits
// nothing on success; throws naming the unbacked class on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

// The consumer token added on top of the frozen upstream package.
const PROBE_RGB = 'rgb(183, 2, 51)';

// Playwright's console surface, narrowed to the one member this spec reads.
// captureMissSite's warning lands on console.warn, so this is where the
// "no compiled class" evidence arrives.
interface ConsoleMessage {
  text(): string;
}
interface ConsolePage extends SpecPage {
  on(event: 'console', handler: (message: ConsoleMessage) => void): void;
}

interface SpecInput {
  page: SpecPage;
  url: string;
  case: CoreCase;
}

function toExtendedConfig(canonical: string): string {
  const withImport = canonical.replace(
    "import { defineConfig } from '@reference-ui/core'",
    "import { defineConfig } from '@reference-ui/core'\nimport { baseSystem as upstreamBaseSystem } from './upstream/.reference-ui/system/baseSystem.mjs'",
  );
  if (withImport === canonical) throw new Error('canonical ui.config lost its core import');
  const extended = withImport.replace('extends: [],', 'extends: [upstreamBaseSystem],');
  if (extended === withImport) throw new Error('canonical ui.config lost its empty extends');
  return extended;
}

// The runner synced this world standalone (no upstreams, probe unbacked).
// The spec syncs the prebuilt package for real, extends the materialized base
// system it publishes, and re-syncs: the prebuilt fixture's runtime then mints
// a foreign-qualified class the consumer sheet must back. The canonical config
// restores with a heal sync in a finally, so the tree is canonical whatever
// the run does.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  const upstreamDir = path.join(c.worldDir, 'upstream');

  const misses: string[] = [];
  (page as unknown as ConsolePage).on('console', (message) => {
    if (message.text().includes('no compiled class')) misses.push(message.text());
  });

  try {
    await sync(upstreamDir);
    const upstream = fs.readFileSync(
      path.join(upstreamDir, '.reference-ui', 'system', 'baseSystem.mjs'),
      'utf8',
    );
    assert.ok(upstream.includes('core-chain8-up'), 'upstream publishes its system name');
    // Novelty: the probe token lives only downstream, so a painted badge
    // cannot be reading a package-shipped rule by coincidence.
    assert.ok(!upstream.includes('b70233'), 'probe value is absent from the published package');

    fs.writeFileSync(configPath, toExtendedConfig(canonical), 'utf8');
    await sync(c.worldDir);

    await page.goto(`${url}?prebuilt=1`, { waitUntil: 'load' });

    // Positive control: the same consumer token resolves and paints in the
    // consumer's own scope. Green here beside a red badge isolates the miss to
    // the prebuilt path — it is fan-out polarity, not token resolution.
    const local = page.locator('#chain8-local');
    await local.waitFor();
    const localColor = await local.evaluate((el) => getComputedStyle(el).color);
    assert.equal(localColor, PROBE_RGB, `consumer token resolves locally, got ${localColor}`);

    const badge = page.locator('[data-testid="chain8-badge"]');
    await badge.waitFor();

    // RED pre-fan-out: the prebuilt runtime mints
    // `core-chain8-up__c_chain8Ink` but the consumer compile dropped the style
    // prop on the capitalized non-host tag, so no rule backs it and the
    // computed colour falls back to the inherited value. The class and the
    // miss count ride the message so the polarity failure names its cause.
    const { color, className } = await badge.evaluate((el) => ({
      color: getComputedStyle(el).color,
      className: el.className,
    }));
    assert.equal(
      color,
      PROBE_RGB,
      `consumer token paints on the prebuilt component, got ${color} (class ${className}, ${misses.length} miss${misses.length === 1 ? '' : 'es'}: ${misses[0] ?? 'none'})`,
    );

    assert.deepEqual(misses, [], `zero runtime misses, got ${misses.length}`);
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(c.worldDir);
  }
}
