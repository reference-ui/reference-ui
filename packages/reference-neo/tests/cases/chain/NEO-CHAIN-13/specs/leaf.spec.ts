// leaf.spec.ts — spec for NEO-CHAIN-13, the whole-leaf replacement of a light-and-dark token by a light-only
// override. It takes { page, url, case } with the app world synced by the runner. It wires the base stand-in into
// the app's extends, runs a real sync(), and checks the evaluated leaf, the published sheet, and the light paint.
// It restores the canonical config in a finally. Emits nothing on success; throws one line on failure.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import {
  canonicalConfig,
  paintOf,
  readEvaluated,
  restoreDir,
  wireConfig,
  writeConfig,
  type UpstreamLink,
} from '../../shared/upstream.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

const BASE_LINK: UpstreamLink = { binding: 'upstreamBase', from: './theme/base.ts' }
const DARK_VALUE = '#eeeeee'
const LIGHT_PAINT = 'rgb(34, 34, 34)'

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = canonicalConfig(c.worldDir)

  try {
    writeConfig(c.worldDir, wireConfig(canonical, [BASE_LINK], ['upstreamBase']))
    await sync(c.worldDir)

    // The local light leaf replaces the upstream leaf whole, so no dark key survives.
    const icon: unknown = readEvaluated(c.worldDir).tokens.colors?.icon
    assert.deepEqual(icon, { light: '#222222' }, `icon resolves ${JSON.stringify(icon)}, expected light only`);

    const sheet = fs.readFileSync(path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
    assert.ok(!sheet.includes(DARK_VALUE), 'the published sheet carries no dark value for icon');

    await page.goto(url, { waitUntil: 'load' });
    const paint = await paintOf(page, 'probe-icon');
    assert.equal(paint, LIGHT_PAINT, `the icon probe paints ${paint}, expected the local light value`);
  } finally {
    await restoreDir(c.worldDir, canonical)
  }
}
